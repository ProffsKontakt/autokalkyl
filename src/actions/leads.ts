'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, type Role } from '@/lib/auth/permissions'
import { triggerN8NWebhook } from '@/lib/webhooks/n8n'
import type {
  PropertyType,
  InterestType,
  BudgetRange,
  Timeline,
  LeadStatus,
  Elomrade,
  Prisma,
} from '@prisma/client'

// =============================================================================
// CREATE LEAD (Public - from questionnaire)
// =============================================================================

const createLeadSchema = z.object({
  name: z.string().min(2, 'Namn krävs'),
  email: z.string().email('Ogiltig e-postadress'),
  phone: z.string().optional(),
  propertyType: z.enum(['VILLA', 'BOSTADSRATT', 'LAGENHET', 'FORETAG']),
  postalCode: z.string().min(5, 'Postnummer krävs'),
  elomrade: z.enum(['SE1', 'SE2', 'SE3', 'SE4']),
  annualKwh: z.number().positive('Förbrukning måste vara större än 0'),
  hasExistingSolar: z.boolean(),
  interestType: z.enum(['BATTERY', 'SOLAR', 'BOTH']),
  budget: z.enum(['UNDER_100K', 'RANGE_100K_200K', 'OVER_200K', 'UNKNOWN']).optional(),
  timeline: z.enum(['ASAP', 'WITHIN_3_MONTHS', 'WITHIN_6_MONTHS', 'JUST_RESEARCHING']).optional(),
  calculationSnapshot: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export async function createLead(data: CreateLeadInput): Promise<{
  leadId?: string
  matchedCompanies?: number
  error?: string
}> {
  const parsed = createLeadSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        propertyType: parsed.data.propertyType as PropertyType,
        postalCode: parsed.data.postalCode,
        elomrade: parsed.data.elomrade as Elomrade,
        annualKwh: parsed.data.annualKwh,
        hasExistingSolar: parsed.data.hasExistingSolar,
        interestType: parsed.data.interestType as InterestType,
        budget: parsed.data.budget as BudgetRange | undefined,
        timeline: parsed.data.timeline as Timeline | undefined,
        calculationSnapshot: parsed.data.calculationSnapshot as Prisma.InputJsonValue | undefined,
        source: parsed.data.source,
        status: 'NEW',
      },
    })

    // Match with companies
    const matchedCompanyIds = await matchLeadWithCompanies(lead.id)

    // Update lead status if matched
    if (matchedCompanyIds.length > 0) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'MATCHED' },
      })

      // Notify matched companies (fire-and-forget)
      notifyMatchedCompanies(lead.id, matchedCompanyIds).catch((err) => {
        console.error('Failed to notify companies:', err)
      })
    }

    return {
      leadId: lead.id,
      matchedCompanies: matchedCompanyIds.length,
    }
  } catch (error) {
    console.error('Failed to create lead:', error)
    return { error: 'Kunde inte skicka din förfrågan. Försök igen.' }
  }
}

// =============================================================================
// COMPANY MATCHING
// =============================================================================

/**
 * Match a lead with companies based on:
 * 1. Service area (polygon contains lead's postal code coordinates)
 * 2. Interest type match (battery/solar/both)
 * 3. Daily lead limits
 *
 * Returns up to 6 matched company IDs.
 */
async function matchLeadWithCompanies(leadId: string): Promise<string[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  })

  if (!lead) return []

  // Get active companies that match the interest type
  const companies = await prisma.company.findMany({
    where: {
      isActive: true,
      OR: [
        // Company accepts the lead's interest type
        lead.interestType === 'BATTERY'
          ? { acceptsBattery: true }
          : lead.interestType === 'SOLAR'
            ? { acceptsSolar: true }
            : { OR: [{ acceptsBattery: true }, { acceptsSolar: true }] },
      ],
    },
  })

  // Reset daily lead counts if needed
  const now = new Date()
  for (const company of companies) {
    if (!company.leadsResetAt || company.leadsResetAt < startOfDay(now)) {
      await prisma.company.update({
        where: { id: company.id },
        data: { leadsToday: 0, leadsResetAt: startOfDay(now) },
      })
      company.leadsToday = 0
    }
  }

  // Filter companies by:
  // 1. Not at daily limit
  // 2. Service area contains lead's location (if polygon defined)
  const eligibleCompanies = companies.filter((company) => {
    // Check daily limit
    if (company.leadsToday >= company.maxLeadsPerDay) {
      return false
    }

    // If no service area defined, accept all leads
    if (!company.serviceAreaPolygon) {
      return true
    }

    // Check if postal code is in service area
    // For now, we'll use a simple approach - in production, use proper geo libraries
    // This is a placeholder for proper polygon matching
    return true
  })

  // Take up to 6 companies
  const selectedCompanies = eligibleCompanies.slice(0, 6)

  // Create matches
  const matchPromises = selectedCompanies.map((company) =>
    prisma.leadCompanyMatch.create({
      data: {
        leadId,
        companyId: company.id,
      },
    })
  )

  // Increment lead counts
  const countPromises = selectedCompanies.map((company) =>
    prisma.company.update({
      where: { id: company.id },
      data: { leadsToday: { increment: 1 } },
    })
  )

  await Promise.all([...matchPromises, ...countPromises])

  return selectedCompanies.map((c) => c.id)
}

/**
 * Notify matched companies about a new lead.
 */
async function notifyMatchedCompanies(
  leadId: string,
  companyIds: string[]
): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  })

  if (!lead) return

  for (const companyId of companyIds) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) continue

    try {
      // Send email notification via N8N
      await triggerN8NWebhook('lead-notification', {
        companyEmail: company.email,
        companyName: company.name,
        lead: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          propertyType: lead.propertyType,
          postalCode: lead.postalCode,
          elomrade: lead.elomrade,
          annualKwh: Number(lead.annualKwh),
          interestType: lead.interestType,
          budget: lead.budget,
          timeline: lead.timeline,
        },
      })

      // Record notification
      await prisma.leadCompanyMatch.update({
        where: {
          leadId_companyId: { leadId, companyId },
        },
        data: {
          notifiedAt: new Date(),
          notificationMethod: 'EMAIL',
        },
      })

      // If company has webhook URL, also send there
      if (company.webhookUrl) {
        try {
          await fetch(company.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_lead',
              lead: {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                propertyType: lead.propertyType,
                postalCode: lead.postalCode,
                elomrade: lead.elomrade,
                annualKwh: Number(lead.annualKwh),
                interestType: lead.interestType,
                budget: lead.budget,
                timeline: lead.timeline,
              },
            }),
          })

          await prisma.leadCompanyMatch.update({
            where: {
              leadId_companyId: { leadId, companyId },
            },
            data: {
              notificationMethod: 'EMAIL,WEBHOOK',
            },
          })
        } catch (webhookError) {
          console.error(`Webhook failed for company ${companyId}:`, webhookError)
        }
      }
    } catch (error) {
      console.error(`Failed to notify company ${companyId}:`, error)
    }
  }
}

// =============================================================================
// ADMIN: GET LEADS (Authenticated)
// =============================================================================

export async function getLeads(filters?: {
  status?: LeadStatus
  elomrade?: Elomrade
  dateFrom?: Date
  dateTo?: Date
}): Promise<{
  leads?: Array<{
    id: string
    name: string
    email: string
    phone: string | null
    propertyType: PropertyType
    postalCode: string
    elomrade: Elomrade
    interestType: InterestType
    status: LeadStatus
    matchedCompaniesCount: number
    createdAt: Date
  }>
  error?: string
}> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Ej inloggad' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.ORG_VIEW_ALL)) {
    return { error: 'Saknar behörighet' }
  }

  try {
    const leads = await prisma.lead.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.elomrade && { elomrade: filters.elomrade }),
        ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
        ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
      },
      include: {
        _count: {
          select: { matchedCompanies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      leads: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        propertyType: lead.propertyType,
        postalCode: lead.postalCode,
        elomrade: lead.elomrade,
        interestType: lead.interestType,
        status: lead.status,
        matchedCompaniesCount: lead._count.matchedCompanies,
        createdAt: lead.createdAt,
      })),
    }
  } catch (error) {
    console.error('Failed to get leads:', error)
    return { error: 'Kunde inte hämta leads' }
  }
}

// =============================================================================
// ADMIN: UPDATE LEAD STATUS (Authenticated)
// =============================================================================

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Ej inloggad' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.ORG_VIEW_ALL)) {
    return { error: 'Saknar behörighet' }
  }

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to update lead status:', error)
    return { error: 'Kunde inte uppdatera status' }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
