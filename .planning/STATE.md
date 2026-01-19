# Project State: Kalkyla.se

**Last updated:** 2026-01-19T11:18:03Z

## Current Position

- **Phase:** 1 of 5 (Foundation)
- **Plan:** 1 of 8 in phase
- **Status:** In progress
- **Last activity:** 2026-01-19 - Completed 01-01-PLAN.md (Project Setup & Database Foundation)

**Progress:**
```
Phase 1: [#.......] 1/8 plans complete
Overall: [#.......] 1/40 plans complete (estimated)
```

## Accumulated Decisions

| Date | Phase | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-01-19 | 01-01 | Used Next.js 16.1.3 instead of 15.x | create-next-app installs latest by default, 16.x is stable |
| 2026-01-19 | 01-01 | Prisma 7.2 with prisma.config.ts pattern | New Prisma 7.x architecture, DATABASE_URL moved from schema |
| 2026-01-19 | 01-01 | Tenant scoping via Prisma $extends | ORM-level filtering, RLS as future defense-in-depth |
| 2026-01-19 | 01-01 | Optional orgId for SUPER_ADMIN users | Platform-level admins need cross-org access |

## Known Blockers/Concerns

| Item | Severity | Status | Notes |
|------|----------|--------|-------|
| Neon database setup required | MEDIUM | Pending | User must configure DATABASE_URL before 01-02 |
| next-auth is beta (5.0.0-beta.30) | LOW | Accepted | Only stable v5 is beta, production-ready per docs |

## Tech Stack

**Core:**
- Next.js 16.1.3 (App Router, Turbopack)
- React 19.2.3
- TypeScript 5.x
- Tailwind CSS 4.x

**Database:**
- PostgreSQL (Neon - pending setup)
- Prisma 7.2.0

**Auth:**
- NextAuth 5.0.0-beta.30
- @auth/prisma-adapter 2.11.1

**Forms & State:**
- React Hook Form 7.71.1
- Zod 4.3.5
- TanStack Query 5.90.19

## Key Files Reference

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Multi-tenant database models |
| `prisma.config.ts` | Prisma 7.x configuration |
| `src/lib/db/client.ts` | Base Prisma client singleton |
| `src/lib/db/tenant-client.ts` | Tenant-scoped client factory |
| `.env.example` | Environment variable documentation |

## Session Continuity

- **Last session:** 2026-01-19T11:18:03Z
- **Stopped at:** Completed 01-01-PLAN.md
- **Resume with:** 01-02-PLAN.md (Auth Configuration)
- **Prerequisite:** Configure DATABASE_URL in .env.local with Neon connection string
