import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

// Enable WebSocket support for Node.js environments (not needed in Edge/Vercel)
if (typeof globalThis.WebSocket === 'undefined') {
  // Dynamic import to avoid bundling ws in Edge runtime
  import('ws').then((ws) => {
    neonConfig.webSocketConstructor = ws.default;
  });
}

/**
 * Prisma client singleton for global database access.
 *
 * Uses Neon's serverless driver which works over HTTPS/WebSocket,
 * bypassing port 5432 which may be blocked by some networks.
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

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  // Prisma 7 pattern: pass connectionString directly to adapter
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
