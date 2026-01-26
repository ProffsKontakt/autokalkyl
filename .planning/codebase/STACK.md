# Technology Stack

**Analysis Date:** 2026-01-26

## Languages

**Primary:**
- TypeScript 5 - Full codebase (frontend and backend)
- JavaScript (Node.js) - Build and configuration files

**Secondary:**
- PostgreSQL SQL - Database schema via Prisma

## Runtime

**Environment:**
- Node.js (version not specified via .nvmrc or package.json engines field)

**Package Manager:**
- npm (lockfile: package-lock.json present)

## Frameworks

**Core:**
- Next.js 16.1.3 - Full-stack React framework (API routes, server actions, App Router)
- React 19.2.3 - UI library
- React DOM 19.2.3 - React rendering target

**Authentication:**
- NextAuth.js (Auth.js) 5.0.0-beta.30 - Authentication and session management

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state management
- Zod 4.3.5 - Schema validation

**Data Management:**
- Prisma 7.2.0 - ORM and database access
- TanStack React Query 5.90.19 - Server state management

**UI & Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- Tailwind Merge 3.4.0 - Merge conflicting Tailwind classes
- PostCSS 4 (via @tailwindcss/postcss) - CSS processing
- Lucide React 0.562.0 - Icon library
- Framer Motion 12.27.2 - Animation library
- Recharts 3.6.0 - Chart visualization library

**PDF Generation:**
- @react-pdf/renderer 4.3.2 - Generate PDF from React components

**State Management:**
- Zustand 5.0.10 - Lightweight client-side state store

**Utilities:**
- date-fns 4.1.0 - Date manipulation and formatting
- Decimal.js 10.6.0 - Arbitrary precision decimal arithmetic
- nanoid 5.1.6 - Secure URL-friendly unique ID generation
- bcryptjs 3.0.3 - Password hashing
- file-saver 2.0.5 - File download in browser
- use-debounce 10.1.0 - Debounce hook
- clsx 2.1.1 - Conditional className management
- ws 8.19.0 - WebSocket client (Neon serverless support)

**Testing/Build:**
- ESLint 9 - Code linting
- TypeScript 5 - Type checking

## Key Dependencies

**Critical:**
- `@prisma/client` 7.2.0 - Database client (primary data access)
- `@prisma/adapter-neon` 7.2.0 - Neon serverless PostgreSQL adapter
- `@neondatabase/serverless` 1.0.2 - Neon HTTPS/WebSocket driver for serverless environments
- `next-auth` 5.0.0-beta.30 - Authentication (handles login/session)
- `@auth/prisma-adapter` 2.11.1 - NextAuth adapter for Prisma

**Infrastructure:**
- `@sentry/nextjs` 10.35.0 - Error tracking and performance monitoring (server, client, edge)
- `posthog-js` 1.331.0 - Product analytics and session recording
- `bcryptjs` 3.0.3 - Cryptographic hashing for passwords

## Configuration

**Environment:**
- Loads from `.env.local` and `.env` (dotenv auto-loaded by Next.js)
- Prisma migrations: `prisma/migrations/`
- Seed file: `prisma/seed.ts`

**Build:**
- TypeScript Config: `tsconfig.json` (ES2017 target, strict mode enabled)
- Next.js Config: `next.config.ts` (Sentry integration, Neon serverless packages)
- PostCSS Config: `postcss.config.mjs` (Tailwind CSS 4 with @tailwindcss/postcss plugin)
- Prisma Config: `prisma.config.ts` (DATABASE_URL connection, migrations path)
- ESLint Config: `eslint.config.mjs` (Next.js core-web-vitals + TypeScript rules)
- Sentry Configs:
  - `sentry.server.config.ts` - Server-side error tracking
  - `sentry.client.config.ts` - Client-side with session replay
  - `sentry.edge.config.ts` - Edge runtime (middleware)

## Platform Requirements

**Development:**
- Node.js (no minimum version specified)
- npm for dependency management
- PostgreSQL database (via Neon)
- Environment variables configured per `.env.example`

**Production:**
- Node.js 18+ (implied by Next.js 16 compatibility)
- Neon PostgreSQL serverless database
- Vercel (implied by sentry.config using SENTRY_AUTH_TOKEN)
- Environment secrets: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SENTRY_DSN

---

*Stack analysis: 2026-01-26*
