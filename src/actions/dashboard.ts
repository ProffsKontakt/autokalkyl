'use server'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/client'
import { createTenantClient } from '@/lib/db/tenant-client'
import { hasPermission, PERMISSIONS, type Role } from '@/lib/auth/permissions'

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardStats {
  totalCalculations: number
  totalViews: number
  recentCalculations: {
    id: string
    customerName: string
    status: string
    createdAt: Date
    updatedAt: Date
    viewCount: number
    lastViewedAt: Date | null
    shareCode: string | null
    batteryName: string | null
    closerName?: string
    orgName?: string
  }[]
}

export interface OrgStats {
  id: string
  name: string
  slug: string
  isProffsKontaktAffiliated: boolean
  calculationCount: number
  userCount: number
  totalViews: number
}

export interface CalculationForDashboard {
  id: string
  customerName: string
  status: string
  elomrade: string
  createdAt: Date
  updatedAt: Date
  finalizedAt: Date | null
  viewCount: number
  lastViewedAt: Date | null
  shareCode: string | null
  shareIsActive: boolean
  batteryName: string | null
  closerName: string
  closerEmail: string
  orgName: string
  orgSlug: string
}

// =============================================================================
// GET DASHBOARD STATS
// =============================================================================

/**
 * Get dashboard statistics for the current user.
 *
 * - Super Admin: aggregate across all orgs
 * - Org Admin: aggregate for their org
 * - Closer: aggregate for their own calculations
 */
export async function getDashboardStats(): Promise<{ data?: DashboardStats; error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role as Role

  try {
    if (role === 'SUPER_ADMIN') {
      // All calculations across all orgs
      const [totalCalcs, totalViews, recent] = await Promise.all([
        prisma.calculation.count({ where: { status: { not: 'ARCHIVED' } } }),
        prisma.calculationView.count(),
        prisma.calculation.findMany({
          where: { status: { not: 'ARCHIVED' } },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            _count: { select: { views: true } },
            batteries: {
              include: { batteryConfig: { select: { name: true, brand: { select: { name: true } } } } },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
            organization: { select: { name: true } },
          },
        }),
      ])

      // Get last viewed for each recent calc
      const recentWithLastViewed = await Promise.all(
        recent.map(async (c) => {
          const lastView = await prisma.calculationView.findFirst({
            where: { calculationId: c.id },
            orderBy: { viewedAt: 'desc' },
            select: { viewedAt: true },
          })
          return {
            id: c.id,
            customerName: c.customerName,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            viewCount: c._count.views,
            lastViewedAt: lastView?.viewedAt || null,
            shareCode: c.shareCode,
            batteryName: c.batteries[0]
              ? `${c.batteries[0].batteryConfig.brand.name} ${c.batteries[0].batteryConfig.name}`
              : null,
            orgName: c.organization.name,
          }
        })
      )

      return {
        data: {
          totalCalculations: totalCalcs,
          totalViews,
          recentCalculations: recentWithLastViewed,
        },
      }
    } else if (role === 'ORG_ADMIN') {
      // Org's calculations
      const tenantClient = createTenantClient(session.user.orgId!)
      const [totalCalcs, recent] = await Promise.all([
        tenantClient.calculation.count({ where: { status: { not: 'ARCHIVED' } } }),
        tenantClient.calculation.findMany({
          where: { status: { not: 'ARCHIVED' } },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            _count: { select: { views: true } },
            batteries: {
              include: { batteryConfig: { select: { name: true, brand: { select: { name: true } } } } },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        }),
      ])

      // Get total views for org
      const totalViews = await prisma.calculationView.count({
        where: { calculation: { orgId: session.user.orgId! } },
      })

      // Get last viewed and closer name for each recent calc
      const recentWithDetails = await Promise.all(
        recent.map(async (c) => {
          const [lastView, closer] = await Promise.all([
            prisma.calculationView.findFirst({
              where: { calculationId: c.id },
              orderBy: { viewedAt: 'desc' },
              select: { viewedAt: true },
            }),
            prisma.user.findUnique({
              where: { id: c.createdBy },
              select: { name: true },
            }),
          ])
          return {
            id: c.id,
            customerName: c.customerName,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            viewCount: c._count.views,
            lastViewedAt: lastView?.viewedAt || null,
            shareCode: c.shareCode,
            batteryName: c.batteries[0]
              ? `${c.batteries[0].batteryConfig.brand.name} ${c.batteries[0].batteryConfig.name}`
              : null,
            closerName: closer?.name,
          }
        })
      )

      return {
        data: {
          totalCalculations: totalCalcs,
          totalViews,
          recentCalculations: recentWithDetails,
        },
      }
    } else {
      // CLOSER - own calculations only
      const tenantClient = createTenantClient(session.user.orgId!)
      const [totalCalcs, recent] = await Promise.all([
        tenantClient.calculation.count({
          where: { createdBy: session.user.id, status: { not: 'ARCHIVED' } },
        }),
        tenantClient.calculation.findMany({
          where: { createdBy: session.user.id, status: { not: 'ARCHIVED' } },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            _count: { select: { views: true } },
            batteries: {
              include: { batteryConfig: { select: { name: true, brand: { select: { name: true } } } } },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        }),
      ])

      // Get total views for user's calculations
      const calcIds = recent.map((c) => c.id)
      const totalViews = await prisma.calculationView.count({
        where: { calculationId: { in: calcIds } },
      })

      // Get last viewed for each recent calc
      const recentWithLastViewed = await Promise.all(
        recent.map(async (c) => {
          const lastView = await prisma.calculationView.findFirst({
            where: { calculationId: c.id },
            orderBy: { viewedAt: 'desc' },
            select: { viewedAt: true },
          })
          return {
            id: c.id,
            customerName: c.customerName,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            viewCount: c._count.views,
            lastViewedAt: lastView?.viewedAt || null,
            shareCode: c.shareCode,
            batteryName: c.batteries[0]
              ? `${c.batteries[0].batteryConfig.brand.name} ${c.batteries[0].batteryConfig.name}`
              : null,
          }
        })
      )

      return {
        data: {
          totalCalculations: totalCalcs,
          totalViews,
          recentCalculations: recentWithLastViewed,
        },
      }
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return { error: 'Kunde inte hämta statistik' }
  }
}

// =============================================================================
// GET ORGANIZATIONS WITH STATS (Super Admin only)
// =============================================================================

/**
 * Get all organizations with calculation counts.
 *
 * Super Admin only.
 */
export async function getOrganizationsWithStats(): Promise<{ data?: OrgStats[]; error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.ORG_VIEW_ALL)) {
    return { error: 'Forbidden' }
  }

  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            calculations: { where: { status: { not: 'ARCHIVED' } } },
            users: { where: { isActive: true } },
          },
        },
      },
    })

    // Get total views per org
    const orgsWithViews = await Promise.all(
      orgs.map(async (org) => {
        const totalViews = await prisma.calculationView.count({
          where: { calculation: { orgId: org.id } },
        })
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          isProffsKontaktAffiliated: org.isProffsKontaktAffiliated,
          calculationCount: org._count.calculations,
          userCount: org._count.users,
          totalViews,
        }
      })
    )

    return { data: orgsWithViews }
  } catch (error) {
    console.error('Get orgs error:', error)
    return { error: 'Kunde inte hämta organisationer' }
  }
}

// =============================================================================
// GET CALCULATIONS FOR DASHBOARD (Super Admin - filterable)
// =============================================================================

export interface CalculationsFilter {
  orgId?: string
  closerId?: string
  dateFrom?: string
  dateTo?: string
}

/**
 * Get all calculations with filters.
 *
 * Super Admin only - can filter by org, closer, date range.
 */
export async function getCalculationsForDashboard(
  filters: CalculationsFilter = {}
): Promise<{ data?: CalculationForDashboard[]; error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_VIEW_ALL)) {
    return { error: 'Forbidden' }
  }

  try {
    const where: Record<string, unknown> = {
      status: { not: 'ARCHIVED' },
    }

    if (filters.orgId) {
      where.orgId = filters.orgId
    }
    if (filters.closerId) {
      where.createdBy = filters.closerId
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(filters.dateTo)
      }
    }

    const calculations = await prisma.calculation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        _count: { select: { views: true } },
        batteries: {
          include: { batteryConfig: { select: { name: true, brand: { select: { name: true } } } } },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        organization: { select: { name: true, slug: true } },
      },
    })

    // Get closer info and last viewed for each
    const calcsWithDetails = await Promise.all(
      calculations.map(async (c) => {
        const [closer, lastView] = await Promise.all([
          prisma.user.findUnique({
            where: { id: c.createdBy },
            select: { name: true, email: true },
          }),
          prisma.calculationView.findFirst({
            where: { calculationId: c.id },
            orderBy: { viewedAt: 'desc' },
            select: { viewedAt: true },
          }),
        ])
        return {
          id: c.id,
          customerName: c.customerName,
          status: c.status,
          elomrade: c.elomrade,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          finalizedAt: c.finalizedAt,
          viewCount: c._count.views,
          lastViewedAt: lastView?.viewedAt || null,
          shareCode: c.shareCode,
          shareIsActive: c.shareIsActive,
          batteryName: c.batteries[0]
            ? `${c.batteries[0].batteryConfig.brand.name} ${c.batteries[0].batteryConfig.name}`
            : null,
          closerName: closer?.name || 'Okänd',
          closerEmail: closer?.email || '',
          orgName: c.organization.name,
          orgSlug: c.organization.slug,
        }
      })
    )

    return { data: calcsWithDetails }
  } catch (error) {
    console.error('Get calculations error:', error)
    return { error: 'Kunde inte hämta kalkyler' }
  }
}
