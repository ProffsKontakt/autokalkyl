'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/client'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, type Role } from '@/lib/auth/permissions'

// =============================================================================
// SCHEMAS
// =============================================================================

const companySchema = z.object({
  name: z.string().min(2, 'Företagsnamn krävs'),
  email: z.string().email('Ogiltig e-postadress'),
  phone: z.string().optional(),
  webhookUrl: z.string().url('Ogiltig webhook URL').optional().or(z.literal('')),
  acceptsBattery: z.boolean().default(true),
  acceptsSolar: z.boolean().default(true),
  maxLeadsPerDay: z.number().int().positive().default(10),
  serviceAreaPolygon: z.any().optional(),
})

export type CompanyFormData = z.infer<typeof companySchema>

// =============================================================================
// GET COMPANIES (Admin only)
// =============================================================================

export async function getCompanies(): Promise<{
  companies?: Array<{
    id: string
    name: string
    email: string
    phone: string | null
    webhookUrl: string | null
    isActive: boolean
    acceptsBattery: boolean
    acceptsSolar: boolean
    maxLeadsPerDay: number
    leadsToday: number
    matchedLeadsCount: number
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
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { matchedLeads: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return {
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        webhookUrl: c.webhookUrl,
        isActive: c.isActive,
        acceptsBattery: c.acceptsBattery,
        acceptsSolar: c.acceptsSolar,
        maxLeadsPerDay: c.maxLeadsPerDay,
        leadsToday: c.leadsToday,
        matchedLeadsCount: c._count.matchedLeads,
        createdAt: c.createdAt,
      })),
    }
  } catch (error) {
    console.error('Failed to get companies:', error)
    return { error: 'Kunde inte hämta företag' }
  }
}

// =============================================================================
// CREATE COMPANY
// =============================================================================

export async function createCompany(data: CompanyFormData): Promise<{
  companyId?: string
  error?: string
}> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Ej inloggad' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.ORG_CREATE)) {
    return { error: 'Saknar behörighet' }
  }

  const parsed = companySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const company = await prisma.company.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        webhookUrl: parsed.data.webhookUrl || null,
        acceptsBattery: parsed.data.acceptsBattery,
        acceptsSolar: parsed.data.acceptsSolar,
        maxLeadsPerDay: parsed.data.maxLeadsPerDay,
        serviceAreaPolygon: parsed.data.serviceAreaPolygon || null,
      },
    })

    revalidatePath('/admin/companies')
    return { companyId: company.id }
  } catch (error) {
    console.error('Failed to create company:', error)
    return { error: 'Kunde inte skapa företaget' }
  }
}

// =============================================================================
// UPDATE COMPANY
// =============================================================================

export async function updateCompany(
  companyId: string,
  data: Partial<CompanyFormData>
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Ej inloggad' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.ORG_EDIT_ANY)) {
    return { error: 'Saknar behörighet' }
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl || null }),
        ...(data.acceptsBattery !== undefined && { acceptsBattery: data.acceptsBattery }),
        ...(data.acceptsSolar !== undefined && { acceptsSolar: data.acceptsSolar }),
        ...(data.maxLeadsPerDay !== undefined && { maxLeadsPerDay: data.maxLeadsPerDay }),
        ...(data.serviceAreaPolygon !== undefined && { serviceAreaPolygon: data.serviceAreaPolygon }),
      },
    })

    revalidatePath('/admin/companies')
    return { success: true }
  } catch (error) {
    console.error('Failed to update company:', error)
    return { error: 'Kunde inte uppdatera företaget' }
  }
}

// =============================================================================
// TOGGLE COMPANY ACTIVE STATUS
// =============================================================================

export async function toggleCompanyActive(companyId: string): Promise<{
  success?: boolean
  isActive?: boolean
  error?: string
}> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Ej inloggad' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.ORG_EDIT_ANY)) {
    return { error: 'Saknar behörighet' }
  }

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return { error: 'Företaget hittades inte' }
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { isActive: !company.isActive },
    })

    revalidatePath('/admin/companies')
    return { success: true, isActive: updated.isActive }
  } catch (error) {
    console.error('Failed to toggle company:', error)
    return { error: 'Kunde inte ändra status' }
  }
}

// =============================================================================
// DELETE COMPANY
// =============================================================================

export async function deleteCompany(companyId: string): Promise<{
  success?: boolean
  error?: string
}> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Ej inloggad' }
  }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.ORG_DELETE)) {
    return { error: 'Saknar behörighet' }
  }

  try {
    await prisma.company.delete({ where: { id: companyId } })
    revalidatePath('/admin/companies')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete company:', error)
    return { error: 'Kunde inte ta bort företaget' }
  }
}
