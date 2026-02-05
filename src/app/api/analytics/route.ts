/**
 * PostHog Query API Proxy
 *
 * This API route proxies PostHog Query API requests with role-based data filtering.
 * PostHog embedded iframes cannot filter by org/user dynamically. This API adds
 * HogQL WHERE clauses based on user role, enabling role-scoped dashboards.
 *
 * Endpoints:
 * - POST /api/analytics - Execute custom HogQL query with role filtering
 * - GET /api/analytics?type=<type>&days=<days> - Execute predefined query templates
 *
 * Role-based filtering:
 * - SUPER_ADMIN: No filter (sees all data)
 * - ORG_ADMIN: Filter by org_id
 * - CLOSER: Filter by closer_id
 */

import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

// Predefined query templates for common dashboard needs
const PREDEFINED_QUERIES: Record<string, (days: number) => string> = {
  // Calculations over time
  'calculations-trend': (days: number) => `
    SELECT
      formatDateTime(timestamp, '%Y-%m-%d') as date,
      count() as count
    FROM events
    WHERE event = 'calculation_created'
      AND timestamp > now() - interval ${days} day
    GROUP BY date
    ORDER BY date ASC
  `,

  // Top closers by calculations (for Org Admin)
  'closer-performance': (days: number) => `
    SELECT
      properties.closer_id as closer_id,
      count() as calculations,
      countIf(event = 'calculation_viewed' AND properties.viewer_type = 'prospect') as prospect_views
    FROM events
    WHERE event IN ('calculation_created', 'calculation_viewed')
      AND timestamp > now() - interval ${days} day
    GROUP BY closer_id
    ORDER BY calculations DESC
    LIMIT 20
  `,

  // Organization comparison (for Super Admin)
  'org-comparison': (days: number) => `
    SELECT
      properties.org_id as org_id,
      count() as total_calculations,
      countIf(event = 'calculation_viewed' AND properties.viewer_type = 'prospect') as prospect_views
    FROM events
    WHERE event IN ('calculation_created', 'calculation_viewed')
      AND timestamp > now() - interval ${days} day
    GROUP BY org_id
    ORDER BY total_calculations DESC
    LIMIT 50
  `,

  // My calculations engagement (for Closer)
  'my-calculations': (days: number) => `
    SELECT
      properties.calculation_id as calc_id,
      properties.customer_name as customer,
      max(timestamp) as last_activity,
      countIf(event = 'calculation_viewed' AND properties.viewer_type = 'prospect') as views
    FROM events
    WHERE event IN ('calculation_created', 'calculation_viewed')
      AND timestamp > now() - interval ${days} day
    GROUP BY calc_id, customer
    ORDER BY last_activity DESC
    LIMIT 50
  `,
}

/**
 * Inject a WHERE clause condition into a HogQL query.
 *
 * Handles both cases:
 * 1. Query already has WHERE - adds AND condition before GROUP BY/ORDER BY/LIMIT
 * 2. Query has no WHERE - adds WHERE clause before GROUP BY/ORDER BY/LIMIT
 */
function injectWhereClause(query: string, condition: string): string {
  const upperQuery = query.toUpperCase()

  // Find positions of clauses that come after WHERE
  const groupByPos = upperQuery.indexOf('GROUP BY')
  const orderByPos = upperQuery.indexOf('ORDER BY')
  const limitPos = upperQuery.indexOf('LIMIT')

  // Find the earliest clause position (insertion point)
  const insertPos = Math.min(
    groupByPos > -1 ? groupByPos : Infinity,
    orderByPos > -1 ? orderByPos : Infinity,
    limitPos > -1 ? limitPos : Infinity,
    query.length
  )

  if (upperQuery.includes('WHERE')) {
    // Query has WHERE - add AND condition before next clause
    return (
      query.slice(0, insertPos).trimEnd() +
      ` AND ${condition} ` +
      query.slice(insertPos)
    )
  } else {
    // No WHERE clause - add WHERE before next clause
    return (
      query.slice(0, insertPos).trimEnd() +
      ` WHERE ${condition} ` +
      query.slice(insertPos)
    )
  }
}

/**
 * Execute a HogQL query against PostHog Query API with role-based filtering.
 */
async function executeQuery(
  query: string,
  session: { user: { id: string; role: string; orgId: string | null } }
): Promise<Response> {
  // Apply role-based filter
  let filteredQuery = query
  const role = session.user.role

  if (role === 'CLOSER') {
    filteredQuery = injectWhereClause(
      query,
      `properties.closer_id = '${session.user.id}'`
    )
  } else if (role === 'ORG_ADMIN') {
    if (session.user.orgId) {
      filteredQuery = injectWhereClause(
        query,
        `properties.org_id = '${session.user.orgId}'`
      )
    }
  }
  // SUPER_ADMIN gets unfiltered query

  // Check required environment variables
  const posthogHost = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com'
  const projectId = process.env.POSTHOG_PROJECT_ID
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY

  if (!projectId) {
    return NextResponse.json(
      { error: 'POSTHOG_PROJECT_ID not configured' },
      { status: 500 }
    )
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'POSTHOG_PERSONAL_API_KEY not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `${posthogHost}/api/projects/${projectId}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: {
            kind: 'HogQLQuery',
            query: filteredQuery,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[analytics] PostHog query failed:', {
        status: response.status,
        error: errorText,
      })
      return NextResponse.json(
        { error: 'PostHog query failed', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[analytics] Failed to fetch from PostHog:', error)
    return NextResponse.json(
      { error: 'Failed to connect to PostHog' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics
 *
 * Execute a custom HogQL query with role-based filtering.
 *
 * Request body:
 * { "query": "SELECT ... FROM events WHERE ..." }
 *
 * Response:
 * PostHog Query API response with results array
 */
export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { query?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { query } = body

  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { error: 'Query required and must be a string' },
      { status: 400 }
    )
  }

  return executeQuery(query, session)
}

/**
 * GET /api/analytics
 *
 * Execute a predefined query template with role-based filtering.
 *
 * Query parameters:
 * - type: Query template name (required)
 * - days: Number of days to look back (default: 30)
 *
 * Available query types:
 * - calculations-trend: Calculations over time
 * - closer-performance: Top closers by calculations
 * - org-comparison: Organization comparison
 * - my-calculations: My calculations with engagement
 *
 * Response:
 * PostHog Query API response with results array
 */
export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const queryType = searchParams.get('type')
  const days = parseInt(searchParams.get('days') || '30', 10)

  if (!queryType) {
    return NextResponse.json(
      {
        error: 'Query type required',
        available: Object.keys(PREDEFINED_QUERIES),
      },
      { status: 400 }
    )
  }

  const queryTemplate = PREDEFINED_QUERIES[queryType]

  if (!queryTemplate) {
    return NextResponse.json(
      {
        error: 'Invalid query type',
        available: Object.keys(PREDEFINED_QUERIES),
      },
      { status: 400 }
    )
  }

  // Validate days parameter
  const validDays = Math.min(Math.max(1, days), 365) // Clamp between 1 and 365

  const query = queryTemplate(validDays)
  return executeQuery(query, session)
}
