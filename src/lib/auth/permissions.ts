/**
 * Role-Based Access Control (RBAC) permission system.
 *
 * Defines the role hierarchy and permissions for the multi-tenant system:
 * - SUPER_ADMIN: Platform-level admin, all permissions, cross-org access
 * - ORG_ADMIN: Organization admin, manages users and settings for own org
 * - CLOSER: Sales closer, can create calculations only
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  CLOSER: 'CLOSER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Organization permissions
  ORG_CREATE: 'org:create',
  ORG_DELETE: 'org:delete',
  ORG_VIEW_ALL: 'org:view_all',
  ORG_EDIT_ANY: 'org:edit_any',
  ORG_EDIT_OWN: 'org:edit_own',

  // User permissions
  USER_CREATE_ORG_ADMIN: 'user:create_org_admin',
  USER_CREATE_CLOSER: 'user:create_closer',
  USER_EDIT: 'user:edit',
  USER_DEACTIVATE: 'user:deactivate',
  USER_VIEW_ALL: 'user:view_all',
  USER_VIEW_ORG: 'user:view_org',

  // Battery permissions
  BATTERY_CREATE: 'battery:create',
  BATTERY_EDIT: 'battery:edit',
  BATTERY_DELETE: 'battery:delete',
  BATTERY_VIEW: 'battery:view',

  // Natagare permissions
  NATAGARE_CREATE: 'natagare:create',
  NATAGARE_EDIT: 'natagare:edit',
  NATAGARE_DELETE: 'natagare:delete',
  NATAGARE_VIEW: 'natagare:view',

  // Electricity pricing permissions
  ELPRICES_VIEW: 'elprices:view',
  ELPRICES_MANAGE: 'elprices:manage', // Super Admin only - manual entry/fetch

  // Calculation permissions
  CALCULATION_CREATE: 'calculation:create',
  CALCULATION_VIEW: 'calculation:view',
  CALCULATION_VIEW_ALL: 'calculation:view_all',
  CALCULATION_VIEW_ORG: 'calculation:view_org',
  CALCULATION_EDIT: 'calculation:edit',
  CALCULATION_DELETE: 'calculation:delete',
  CALCULATION_FINALIZE: 'calculation:finalize',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role-to-permissions mapping.
 *
 * SUPER_ADMIN has all permissions.
 * ORG_ADMIN can manage their org and create closers.
 * CLOSER can only create calculations.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS), // All permissions
  ORG_ADMIN: [
    // Organization
    PERMISSIONS.ORG_EDIT_OWN,
    // Users
    PERMISSIONS.USER_CREATE_CLOSER,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DEACTIVATE,
    PERMISSIONS.USER_VIEW_ORG,
    // Batteries (full CRUD for org-scoped data)
    PERMISSIONS.BATTERY_CREATE,
    PERMISSIONS.BATTERY_EDIT,
    PERMISSIONS.BATTERY_DELETE,
    PERMISSIONS.BATTERY_VIEW,
    // Natagare (full CRUD for org-scoped data)
    PERMISSIONS.NATAGARE_CREATE,
    PERMISSIONS.NATAGARE_EDIT,
    PERMISSIONS.NATAGARE_DELETE,
    PERMISSIONS.NATAGARE_VIEW,
    // Electricity prices (view only - global data)
    PERMISSIONS.ELPRICES_VIEW,
    // Calculations (can view/edit all org calculations)
    PERMISSIONS.CALCULATION_CREATE,
    PERMISSIONS.CALCULATION_VIEW,
    PERMISSIONS.CALCULATION_VIEW_ORG,
    PERMISSIONS.CALCULATION_EDIT,
    PERMISSIONS.CALCULATION_DELETE,
    PERMISSIONS.CALCULATION_FINALIZE,
  ],
  CLOSER: [
    // View reference data (needed for creating calculations)
    PERMISSIONS.BATTERY_VIEW,
    PERMISSIONS.NATAGARE_VIEW,
    PERMISSIONS.ELPRICES_VIEW,
    // Calculations (own calculations only - enforced at action level)
    PERMISSIONS.CALCULATION_CREATE,
    PERMISSIONS.CALCULATION_VIEW,
    PERMISSIONS.CALCULATION_EDIT,
    PERMISSIONS.CALCULATION_DELETE,
    PERMISSIONS.CALCULATION_FINALIZE,
  ],
};

/**
 * Check if a role has a specific permission.
 *
 * @param role - User's role
 * @param permission - Permission to check
 * @returns true if role has the permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Require a specific permission, throwing an error if not granted.
 *
 * Use in Server Actions and API routes for authorization checks.
 *
 * @param role - User's role
 * @param permission - Required permission
 * @throws Error if permission not granted
 */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Check if a user can access a specific organization's data.
 *
 * SUPER_ADMIN can access any org.
 * Other roles can only access their own org.
 *
 * @param userRole - User's role
 * @param userOrgId - User's organization ID (null for platform admins)
 * @param targetOrgId - Organization ID being accessed
 * @returns true if access is allowed
 */
export function canAccessOrg(
  userRole: Role,
  userOrgId: string | null,
  targetOrgId: string
): boolean {
  // Super Admin can access any org
  if (userRole === ROLES.SUPER_ADMIN) return true;
  // Others can only access their own org
  return userOrgId === targetOrgId;
}

/**
 * Get all permissions for a role.
 *
 * @param role - User's role
 * @returns Array of permissions granted to the role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
