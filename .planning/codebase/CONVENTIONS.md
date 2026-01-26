# Coding Conventions

**Analysis Date:** 2026-01-26

## Naming Patterns

**Files:**
- Component files: `kebab-case.tsx` - Example: `login-form.tsx`, `battery-config-form.tsx`, `public-consumption-simulator.tsx`
- Action files: `kebab-case.ts` - Example: `calculations.ts`, `organizations.ts`, `password-reset.ts`
- Library/utility files: `kebab-case.ts` - Example: `use-auto-save.ts`, `calculation-wizard-store.ts`, `elomrade-lookup.ts`
- Type definition files: `kebab-case.ts` - Example: `types.ts`, `constants.ts`, `presets.ts`
- Configuration files: `kebab-case.ts` or `.mts` - Example: `auth.config.ts`, `eslint.config.mjs`
- Next.js App Router files: Follow Next.js conventions - `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `not-found.tsx`
- Server Action files: marked with `'use server'` at top of file

**Functions:**
- camelCase for all functions: `createOrganization()`, `updateOrganization()`, `saveDraft()`, `lookupElomrade()`
- Custom React hooks: `useAutoSave()`, `useCalculationWizardStore()`, `useForm()` - prefixed with `use`
- Permission/RBAC functions: `hasPermission()`, `requirePermission()`, `canAccessOrg()`, `getPermissionsForRole()`

**Variables:**
- camelCase for local variables and state: `customerName`, `totalPriceExVat`, `effectiveOrgId`, `marginSek`
- const for constants and immutable exports: `ROLES`, `PERMISSIONS`, `DEFAULT_ANNUAL_CONSUMPTION_KWH`
- Boolean flags: `isPending`, `isLoading`, `isSaving`, `isDraft`, `isProffsKontaktAffiliated`
- Abbreviations preserved in camelCase: `postalCode`, `elomrade`, `natagareId`, `consumptionProfile` (not `consumptionprofile`)

**Types:**
- PascalCase for interfaces and types: `ButtonProps`, `OrgFormData`, `LoginFormData`, `CalculationResults`, `BatterySelection`
- Suffix convention: use `Props` for component props - Example: `ButtonProps`, `OrgFormProps`
- Type inference from Zod schemas: `type LoginFormData = z.infer<typeof loginSchema>`
- Union types for role/permission enums: defined as `const` objects with `as const` satisfaction

## Code Style

**Formatting:**
- No explicit formatter configured (ESLint only)
- Semicolons: Always included at end of statements
- Quotes: Single quotes for imports and strings - Example: `import { Button } from '@/components/ui/button'`
- Spacing: 2-space indentation (inferred from codebase)
- Line length: No strict enforced limit observed, but generally compact

**Linting:**
- Tool: ESLint 9 with Next.js config
- Config file: `eslint.config.mjs` (new flat config format)
- Applied configs: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Key rules: ESLint defaults for Next.js, TypeScript strict mode enforced via tsconfig

## Import Organization

**Order:**
1. External libraries (React, Next.js, third-party packages)
2. Internal absolute imports (`@/` path aliases)
3. Type imports marked explicitly with `import type` when needed

**Example pattern from `src/actions/calculations.ts`:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, Role, ROLES } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { createTenantClient } from '@/lib/db/tenant-client'
import { triggerMarginAlert } from '@/lib/webhooks/n8n'
import { z } from 'zod'
import type { ConsumptionProfile, Elomrade } from '@/lib/calculations/types'
```

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)
- Used throughout for cleaner imports: `@/components`, `@/actions`, `@/lib`, `@/stores`, `@/hooks`, `@/types`

## Error Handling

**Patterns:**
- Server actions: Return error objects instead of throwing
  - Success: `{ success: true, organizationId: org.id }`
  - Error: `{ error: 'Error message' }`
  - Example from `src/actions/organizations.ts`: `return { error: 'Ej inloggad' }`

- Zod validation: Use `safeParse()` to validate input, return first error message
  ```typescript
  const parsed = organizationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  ```

- Database operations: Wrap in try-catch, log errors to console
  ```typescript
  try {
    const org = await prisma.organization.create({ ... });
    return { success: true, organizationId: org.id };
  } catch (error) {
    console.error('Failed to create organization:', error);
    return { error: 'Kunde inte skapa organisationen' };
  }
  ```

- Client-side errors: Store in local state with useState, display in UI
  - Example: `const [error, setError] = useState<string | null>(null)`
  - Set on validation or async failures: `setError('Felaktig e-postadress eller lösenord')`

- Fire-and-forget operations: Log errors but don't throw
  - Used for margin alert webhooks and analytics
  - Example comment: `// Fire-and-forget: log but don't throw`

- Authorization: Return forbidden errors early
  - Example: `if (!hasPermission(role, PERMISSIONS.ORG_CREATE)) return { error: 'Du har inte behörighet' }`

## Logging

**Framework:** console (built-in browser/Node.js logging)

**Patterns:**
- Error logging: `console.error('Action description:', error)` for all catch blocks
- Contextual prefixes: `console.error('[Margin Alert] Check error:', error)` for subsystems
- No info/debug logging in current codebase - only errors logged
- Client-side errors logged in hooks and form handlers
- Server Action errors logged before returning error objects

**Examples from codebase:**
- `console.error('Save draft error:', error)`
- `console.error('[Margin Alert] Check error:', error)`
- `console.error('Auto-save failed:', error)`
- `console.error('PDF generation failed:', error)`

## Comments

**When to Comment:**
- Block comments for feature/module sections: Appears in every server action file
  ```typescript
  // =============================================================================
  // ZOD SCHEMAS
  // =============================================================================
  ```

- JSDoc-style documentation for exported functions (particularly in lib utilities and permissions)
  - Example from `src/lib/auth/permissions.ts`:
    ```typescript
    /**
     * Check if a role has a specific permission.
     *
     * @param role - User's role
     * @param permission - Permission to check
     * @returns true if role has the permission
     */
    export function hasPermission(role: Role, permission: Permission): boolean
    ```

- Implementation details: Explain non-obvious logic or business requirements
  - Example from middleware: `// This is the FIRST layer of defense only. API routes and Server Actions MUST also verify authorization`

- TODO comments: Single instance observed
  - Example: `// TODO: Calculate final results and finalize` in `src/components/calculations/wizard/calculation-wizard.tsx`

## Function Design

**Size:**
- Server Actions: 40-120 lines typical, organized with clear section comments
- Components: 40-370 lines depending on complexity
- Utility functions: 10-50 lines, focused on single responsibility

**Parameters:**
- Use object destructuring for multiple parameters
- Example: `export async function getCalculation(id: string)` - single params stay simple
- Complex data passed as typed interfaces: `interface OrgFormProps { organization?: {...} }`

**Return Values:**
- Server Actions return `{ success: boolean, data?: any, error?: string }` objects
- React components: JSX elements
- Utility functions: typed return values (e.g., `Elomrade | null`)
- Hooks return custom interfaces documenting return properties with JSDoc

**Example from `src/hooks/use-auto-save.ts`:**
```typescript
interface UseAutoSaveReturn {
  /** Timestamp of last successful save */
  lastSavedAt: Date | null
  /** Whether a save is currently in progress */
  isSaving: boolean
  /** Force an immediate save (flushes debounce) */
  saveNow: () => Promise<void>
}
```

## Module Design

**Exports:**
- Named exports preferred for functions and types
- Example: `export function hasPermission(...)` and `export type { ButtonProps }`
- Default exports used for React components when single export per file
- Type exports explicit: `export type { ButtonProps }` on same line as named export

**Barrel Files:**
- Not extensively used; direct imports preferred via path aliases
- Components export directly: `export { Button }; export type { ButtonProps };`

**Monolithic Action Files:**
- Each domain (organizations, calculations, users, etc.) has one dedicated server action file
- File organization: Schema definitions → function exports, grouped by logical section
- Example structure from `src/actions/calculations.ts`:
  1. `'use server'` directive
  2. Module documentation comment
  3. Imports
  4. Zod schema definitions
  5. Server action functions (organized by operation: save, get, list, finalize, delete)

## Type Safety

**TypeScript Configuration:**
- `strict: true` enabled in `tsconfig.json` - strict null checks, implicit any errors caught
- JSX: `react-jsx` (new React 19 JSX transform)
- Module resolution: `bundler` (Next.js standard)

**Type Usage:**
- Zod for runtime validation + type inference: `type LoginFormData = z.infer<typeof loginSchema>`
- Literal string unions: `variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'gradient'`
- Branded types with `satisfies` for config objects: `} satisfies NextAuthConfig;`
- Optional properties: Use `?` for optional fields in interfaces

---

*Convention analysis: 2026-01-26*
