import { prisma } from './client';

/**
 * Creates a tenant-scoped Prisma client that automatically filters queries by orgId.
 *
 * This is the PRIMARY client for all tenant-specific operations.
 * It ensures data isolation by:
 * - Auto-filtering findMany, findFirst, count operations by orgId
 * - Auto-injecting orgId on create operations
 *
 * CRITICAL: Always use this client for org-scoped operations to prevent data leakage.
 *
 * @example
 * ```ts
 * const session = await auth();
 * const tenantDb = createTenantClient(session.user.orgId);
 *
 * // This automatically filters by orgId
 * const users = await tenantDb.user.findMany();
 * ```
 *
 * @param orgId - The organization ID to scope all queries to
 * @returns A Prisma client with automatic tenant scoping
 */
export function createTenantClient(orgId: string) {
  return prisma.$extends({
    query: {
      // User model - tenant scoped
      user: {
        async $allOperations({ args, query, operation }) {
          // Read operations: filter by orgId
          if (operation === 'findMany' || operation === 'findFirst' || operation === 'count') {
            args.where = { ...args.where, orgId };
          }

          // Create operations: inject orgId
          if (operation === 'create') {
            // Type assertion needed because Prisma's generated types
            // don't know about our extension at compile time
            const data = args.data as Record<string, unknown>;
            (args as { data: Record<string, unknown> }).data = { ...data, orgId };
          }

          // Update operations: ensure we're updating our own org's data
          if (operation === 'update' || operation === 'updateMany') {
            args.where = { ...args.where, orgId };
          }

          // Delete operations: ensure we're deleting our own org's data
          if (operation === 'delete' || operation === 'deleteMany') {
            args.where = { ...args.where, orgId };
          }

          return query(args);
        },
      },

      // BatteryBrand model - tenant scoped
      batteryBrand: {
        async $allOperations({ args, query, operation }) {
          // Read operations: filter by orgId
          if (operation === 'findMany' || operation === 'findFirst' || operation === 'count') {
            args.where = { ...args.where, orgId };
          }

          // Create operations: inject orgId
          if (operation === 'create') {
            const data = args.data as Record<string, unknown>;
            (args as { data: Record<string, unknown> }).data = { ...data, orgId };
          }

          // Update operations: ensure we're updating our own org's data
          if (operation === 'update' || operation === 'updateMany') {
            args.where = { ...args.where, orgId };
          }

          // Delete operations: ensure we're deleting our own org's data
          if (operation === 'delete' || operation === 'deleteMany') {
            args.where = { ...args.where, orgId };
          }

          return query(args);
        },
      },

      // BatteryConfig model - tenant scoped
      batteryConfig: {
        async $allOperations({ args, query, operation }) {
          // Read operations: filter by orgId
          if (operation === 'findMany' || operation === 'findFirst' || operation === 'count') {
            args.where = { ...args.where, orgId };
          }

          // Create operations: inject orgId
          if (operation === 'create') {
            const data = args.data as Record<string, unknown>;
            (args as { data: Record<string, unknown> }).data = { ...data, orgId };
          }

          // Update operations: ensure we're updating our own org's data
          if (operation === 'update' || operation === 'updateMany') {
            args.where = { ...args.where, orgId };
          }

          // Delete operations: ensure we're deleting our own org's data
          if (operation === 'delete' || operation === 'deleteMany') {
            args.where = { ...args.where, orgId };
          }

          return query(args);
        },
      },

      // Natagare model - tenant scoped
      natagare: {
        async $allOperations({ args, query, operation }) {
          // Read operations: filter by orgId
          if (operation === 'findMany' || operation === 'findFirst' || operation === 'count') {
            args.where = { ...args.where, orgId };
          }

          // Create operations: inject orgId
          if (operation === 'create') {
            const data = args.data as Record<string, unknown>;
            (args as { data: Record<string, unknown> }).data = { ...data, orgId };
          }

          // Update operations: ensure we're updating our own org's data
          if (operation === 'update' || operation === 'updateMany') {
            args.where = { ...args.where, orgId };
          }

          // Delete operations: ensure we're deleting our own org's data
          if (operation === 'delete' || operation === 'deleteMany') {
            args.where = { ...args.where, orgId };
          }

          return query(args);
        },
      },

      // NOTE: Add more models here as they're created in later phases
      // Each tenant-scoped model (Calculation, etc.) should follow
      // the same pattern above.
      //
      // Models that are NOT tenant-scoped (use global prisma client instead):
      // - Organization (admin-only)
      // - VerificationToken (system)
      // - ElectricityPrice (global reference data)
      // - ElectricityPriceQuarterly (global reference data)
    },
  });
}

/**
 * Type for the tenant-scoped Prisma client.
 * Use this for typing function parameters that accept a tenant client.
 *
 * @example
 * ```ts
 * async function getUsers(db: TenantPrismaClient) {
 *   return db.user.findMany();
 * }
 * ```
 */
export type TenantPrismaClient = ReturnType<typeof createTenantClient>;
