import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton for global database access.
 *
 * This is the base client used for:
 * - SUPER_ADMIN operations (cross-org access)
 * - Database operations that don't require tenant scoping
 * - Initial setup and migrations
 *
 * For tenant-scoped operations (most of the app), use createTenantClient() instead.
 *
 * @see ./tenant-client.ts
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
