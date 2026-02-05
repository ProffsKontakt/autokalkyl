# Kalkyla.se — Battery ROI Calculator

## What This Is

Multi-tenant SaaS platform where solar/battery sales closers create and share battery ROI calculations with prospects. Built for ProffsKontakt AB and their partner organizations (Hyllinge Solkraft AB, SunBro AB). Closers build calculations with customer-specific data including realistic consumption profiles and peak tariff configurations, share a link, and prospects can interactively tweak their consumption to see real savings, payback periods, and ROI.

## Core Value

Closers can build accurate, interactive battery ROI calculations and share them with prospects who can tweak their own consumption to see real savings — converting more sales through transparency and customization.

## Current State

**Version:** v1.2 Realistic Consumption & Peak Tariffs (shipped 2026-02-05)
**Previous:** v1.1 Fixed ROI Calculations (shipped 2026-02-01)
**Codebase:** ~35,000 lines TypeScript, Next.js 16, Prisma 7.2, Neon PostgreSQL

**Tech stack:**
- Next.js 16 with App Router
- Auth.js v5 (credentials provider, JWT sessions)
- Prisma 7.2 with tenant-scoping extension
- Neon serverless PostgreSQL
- Zustand for client state
- Recharts for charts
- PostHog (server-side analytics), Sentry (errors), N8N (webhooks)

**Production readiness:**
- Database needs `npx prisma migrate deploy` for v1.2 schema
- Environment variables needed: PostHog, Sentry, N8N webhook URL
- Deploy to Vercel

## Requirements

### Validated

All v1.0, v1.1, and v1.2 requirements shipped:

**v1.0 (92 requirements):**
- ✓ AUTH-01 to AUTH-06 — Authentication with role hierarchy — v1.0
- ✓ ORG-01 to ORG-07 — Organization management with branding — v1.0
- ✓ USER-01 to USER-05 — User management with tenant scoping — v1.0
- ✓ BATT-01 to BATT-06 — Battery configuration CRUD — v1.0
- ✓ NATA-01 to NATA-05 — Natagare (grid operators) with tariffs — v1.0
- ✓ ELEC-01 to ELEC-05 — Electricity pricing with Nord Pool integration — v1.0
- ✓ CALC-01 to CALC-15 — Calculation builder with wizard UI — v1.0
- ✓ LOGIC-01 to LOGIC-10 — ROI calculation engine with decimal.js — v1.0
- ✓ CUST-01 to CUST-12 — Customer-facing public view — v1.0
- ✓ SHARE-01 to SHARE-05 — Shareable links with tracking — v1.0
- ✓ ALERT-01 to ALERT-05 — N8N margin alerts — v1.0
- ✓ ANLY-01 to ANLY-06 — PostHog analytics & Sentry monitoring — v1.0
- ✓ DASH-01 to DASH-05 — Admin dashboards with role-based views — v1.0

**v1.1 (21 requirements):**
- ✓ SPOT-01 to SPOT-04 — Spotprisoptimering with correct formula and transparency — v1.1
- ✓ GRID-01 to GRID-05 — Stödtjänster with Emaldo zone-based rates and breakdown — v1.1
- ✓ PEAK-01 to PEAK-04 — Effektavgifter with capacity constraints and breakdown — v1.1
- ✓ TRANS-01 to TRANS-04 — Calculation transparency for prospects — v1.1
- ✓ OVRD-01 to OVRD-04 — Manual override system with invisible sync — v1.1

**v1.2 (27 requirements):**
- ✓ CONS-01 to CONS-05 — Consumption profiles with heating type distribution — v1.2
- ✓ PEAK-05 to PEAK-10 — Peak tariff calculations with natagare-specific methods — v1.2
- ✓ NATA-06 to NATA-11 — Centralized natagare management with approval workflow — v1.2
- ✓ ANLY-07 to ANLY-12 — Server-side PostHog with role-based dashboards — v1.2
- ✓ FIX-01 to FIX-04 — Display bugs and UI polish — v1.2

**Total: 140 requirements validated**

### Active

None — planning next milestone.

### Out of Scope

- Real-time spot price display — Prices change constantly, creates confusion and liability
- Customer self-registration — Spam risk, admin-controlled access preferred
- AI consumption estimates — Unreliable, liability risk
- Multi-currency support — Swedish market only, SEK hardcoded
- In-app chat/messaging — Scope creep, use email instead
- Automatic contract generation — Legal complexity outside scope
- Solar panel calculations — Batteries only for v1
- Mobile app — Web-first approach, PWA works well
- Automatic peak detection from utility API — Requires OAuth integration, high complexity
- Per-day consumption input — Overkill for ROI estimation, monthly sufficient

## Context

**Business context:**
- ProffsKontakt AB sells batteries for partner organizations (Hyllinge Solkraft, SunBro)
- First org is ready for deployment
- Calculation logic validated via Excel spreadsheet
- Future vision: platform could expand to other industries with custom calculation types

**Swedish market specifics:**
- Elomraden: SE1 (north) to SE4 (south) — different spot prices
- Natagare: Grid operators with varying effect tariff structures
- Gron Teknik: Government subsidy for green tech (48.5% battery, 15% solar)
- Effect tariffs: Charged based on peak consumption, quarterly billing

**Known limitations:**
- Vattenfall/E.ON effect tariff rates not officially published (deadline Jan 2027) - using placeholders
- mgrey.se API has no SLA - manual entry fallback implemented

## Constraints

- **Tech stack**: Next.js 16 (App Router), React, Tailwind CSS, Prisma 7.2, PostgreSQL (Neon), Auth.js v5, Vercel hosting
- **Integrations**: N8N (alerts), PostHog (analytics), Sentry (errors), mgrey.se (Nord Pool prices)
- **Architecture**: Battery-specific v1, but structured for potential future expansion

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Battery-only v1 | Ship fast, validate with real users before expanding | ✓ Good — shipped in 2 days |
| Hardcode Gron Teknik at 48.5% | Simplify MVP, assume all customers qualify | ✓ Good — no complaints |
| One average day per month consumption | Balance simplicity and accuracy | ✓ Good — v1.2 adds realistic profiles |
| 500 SEK/kW/year grid services default | Conservative estimate, org-configurable | ✓ Good — configurable per org |
| Credentials auth only | Admin creates users, no self-registration needed | ✓ Good — appropriate for B2B |
| mgrey.se API with fallback | May not have immediate access | ✓ Good — manual entry available |
| Prisma tenant-scoping extension | Isolation without RLS complexity | ✓ Good — works well |
| JWT sessions | Stateless auth for serverless | ✓ Good — no session DB needed |
| Zustand + localStorage persistence | Wizard state survives refresh | ✓ Good — smooth UX |
| decimal.js for financial math | No floating point errors | ✓ Good — accurate calculations |
| On-demand recalculation (not live) | Explicit user intent, clearer UX | ✓ Good — users understand flow |
| Fire-and-forget webhooks | Never block UX for alerts | ✓ Good — errors logged, UX preserved |

## Key Decisions (v1.1)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep calcSpotprisSavings and add V2 | Backwards compatibility with v1.0 code | ✓ Good — no breaking changes |
| Emaldo detection via brand name | Simple heuristic for battery catalog | ✓ Good — works for current catalog |
| currentPeakKw hardcoded to 8 kW | Placeholder until customer data available | ✓ Good — v1.2 centralizes and adds input |
| Build breakdowns server-side | Security — prevents client manipulation | ✓ Good — secure by design |
| Null-based override semantics | Clearer intent, JSON-friendly | ✓ Good — clean implementation |
| Apply overrides server-side | OVRD-04 compliance — invisible to prospects | ✓ Good — satisfies requirement |

## Key Decisions (v1.2)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| HeatingType as enum (not string) | Type safety at database and TypeScript level | ✓ Good — no runtime errors |
| peakCalculationMethod as String | Future-proofs for new grid operators without schema changes | ✓ Good — flexible |
| Night discount BEFORE sorting | Matches Ellevio billing behavior | ✓ Good — accurate calculations |
| posthog-node with immediate flush | Required for Vercel serverless (no persistent process) | ✓ Good — events captured |
| Permanent sidebar over hover dropdown | Better UX for Super Admin navigation | ✓ Good — user feedback positive |
| Runtime normalization of heating factors | Ensures exact sum of 12 for monthly distribution | ✓ Good — mathematically correct |

---
*Last updated: 2026-02-05 after v1.2 milestone*
