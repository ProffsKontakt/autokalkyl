# Testing Patterns

**Analysis Date:** 2026-01-26

## Test Framework

**Status:** No testing framework configured

**Current State:**
- No test files present in `/src` directory
- No jest, vitest, or other test runner configured in `package.json`
- No test configuration files (jest.config.ts, vitest.config.ts, etc.)
- Project is at v0.1.0, likely early stage without formal testing infrastructure

**Run Commands:**
- Not available - no test script in `package.json`
- Available scripts: `dev`, `build`, `start`, `lint`

## Test File Organization

**Pattern:** Not established - no test files in codebase

**Naming Convention:** Not established (commonly `.test.ts`, `.spec.ts` or co-located)

**Recommendation for Future Implementation:**
- Co-locate tests next to implementation: `src/components/ui/button.test.tsx` alongside `src/components/ui/button.tsx`
- Or separate `__tests__` directory per module: `src/components/__tests__/button.test.tsx`

## Test Structure

**Current Testing Approach:**
- Manual testing only (no automated test suite)
- No fixtures, factories, or test utilities defined
- No mocking framework in use

**Recommended Structure for Future Tests:**
```typescript
describe('MyComponent', () => {
  describe('initialization', () => {
    it('should render with default props', () => {
      // arrange
      // act
      // assert
    })
  })

  describe('interaction', () => {
    it('should handle click events', () => {
      // arrange
      // act
      // assert
    })
  })
})
```

## Mocking

**Framework:** Not configured

**Recommendation:**
- For Next.js: Use Jest or Vitest with `@testing-library/react` and `jest.mock()`
- For Server Actions: Mock Prisma with `jest.mock('@/lib/db/client')`
- For API calls: Mock fetch or use MSW (Mock Service Worker)

**Current Patterns Observed (for reference when implementing):**
- Zod validation is single source of truth for input validation
- Server Actions separate business logic from API
- Components are separated from data-fetching logic (via Server Actions)

## Fixtures and Factories

**Status:** Not implemented

**Data Management in Production Code:**
- Default values in forms: Example from `src/components/organizations/org-form.tsx`:
  ```typescript
  defaultValues: organization ? {
    // ... populated from org
  } : {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    isProffsKontaktAffiliated: false,
  }
  ```

- Constants for defaults: Example from `src/lib/calculations/constants.ts`:
  - `DEFAULT_ANNUAL_CONSUMPTION_KWH` used throughout

**Recommendation for Testing:**
- Create `src/__tests__/factories/` directory
- Implement factory functions for entities: `createOrganization()`, `createUser()`, `createCalculation()`
- Store seed data in `src/__tests__/fixtures/` directory
- Example factory pattern:
  ```typescript
  export function createOrganization(overrides: Partial<Organization> = {}): Organization {
    return {
      id: nanoid(),
      name: 'Test Org',
      slug: 'test-org',
      primaryColor: '#3B82F6',
      ...overrides
    }
  }
  ```

## Coverage

**Status:** No coverage requirements enforced

**Recommendation:**
- Start with integration tests for critical paths (auth, calculations, CRUD operations)
- Aim for 80%+ coverage of business logic
- Server Actions should have 100% coverage given they handle auth/data validation
- UI components: focus on user interactions, not component internals

## Test Types

**Unit Tests:**
- **Target:** Utility functions like `lookupElomrade()`, `calculateBatteryROI()`, permission checks
- **Scope:** Single function, isolated from external dependencies
- **Approach:** Pure functions with clear inputs/outputs

**Integration Tests:**
- **Target:** Server Actions with Prisma + auth checks
- **Scope:** Multiple layers: validation → auth → database operation
- **Approach:**
  - Mock `auth()` to return test user
  - Mock `prisma` for database operations
  - Verify permissions are enforced correctly
  - Example from `src/actions/organizations.ts`:
    ```typescript
    export async function createOrganization(data: OrganizationFormData) {
      const session = await auth()
      if (!session?.user) return { error: 'Ej inloggad' }
      if (!hasPermission(session.user.role as Role, PERMISSIONS.ORG_CREATE)) {
        return { error: 'Du har inte behörighet' }
      }
      // ... validation with Zod
      // ... database operation
    }
    ```

**E2E Tests:**
- **Status:** Not implemented
- **Recommendation:** Add Playwright or Cypress for:
  - Login flow
  - Calculation wizard (multi-step form)
  - PDF generation and download
  - Public share links

## Common Patterns to Test

**Server Action Pattern (Critical for Testing):**
```typescript
// Pattern from src/actions/calculations.ts
export async function saveDraft(input: SaveDraftInput) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  // 2. Permission check
  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_CREATE)) {
    return { error: 'Forbidden' }
  }

  // 3. Input validation
  const parsed = saveDraftSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // 4. Business logic
  const data = parsed.data
  let effectiveOrgId: string
  if (role === ROLES.SUPER_ADMIN) {
    if (!data.orgId) return { error: 'Super Admin måste välja en organisation' }
    effectiveOrgId = data.orgId
  } else {
    if (!session.user.orgId) return { error: 'Ingen organisation kopplad' }
    effectiveOrgId = session.user.orgId
  }

  // 5. Database operation
  try {
    const updated = await tenantClient.calculation.update({ ... })
    revalidatePath('/dashboard/calculations')
    return { success: true, calculationId: updated.id }
  } catch (error) {
    console.error('Save draft error:', error)
    return { error: 'Kunde inte spara utkastet' }
  }
}
```

**Test Template for This Pattern:**
```typescript
describe('saveDraft', () => {
  it('should return error if user not authenticated', async () => {
    jest.mock('@/lib/auth/auth', () => ({ auth: () => null }))
    const result = await saveDraft({ /* input */ })
    expect(result.error).toBe('Unauthorized')
  })

  it('should return error if user lacks permission', async () => {
    jest.mock('@/lib/auth/auth', () => ({
      auth: () => ({ user: { id: '1', role: 'CLOSER' } })
    }))
    jest.mock('@/lib/auth/permissions', () => ({
      hasPermission: () => false
    }))
    const result = await saveDraft({ /* input */ })
    expect(result.error).toBe('Forbidden')
  })

  it('should save calculation for valid input', async () => {
    const mockSession = { user: { id: '1', orgId: 'org1', role: 'ORG_ADMIN' } }
    jest.mock('@/lib/auth/auth', () => ({ auth: () => mockSession }))
    const result = await saveDraft(validInput)
    expect(result.success).toBe(true)
    expect(result.calculationId).toBeDefined()
  })
})
```

**Async Testing (Zod Validation):**
```typescript
// Pattern from forms throughout codebase
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
})

const onSubmit = async (data: LoginFormData) => {
  setError(null)
  setIsLoading(true)
  try {
    const result = await signIn('credentials', { /* ... */ })
    if (result?.error) {
      setError('Felaktig e-postadress eller lösenord')
      setIsLoading(false)
      return
    }
    router.push('/dashboard')
  } catch {
    setError('Något gick fel')
    setIsLoading(false)
  }
}
```

**Test Template for Async/Form Pattern:**
```typescript
describe('LoginForm', () => {
  it('should validate email format', async () => {
    render(<LoginForm />)
    const emailInput = screen.getByLabelText('E-postadress')
    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))
    expect(screen.getByText('Ogiltig e-postadress')).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    jest.mock('next-auth/react', () => ({
      signIn: jest.fn(() => ({ ok: true }))
    }))
    render(<LoginForm />)
    // ... fill form and submit
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
  })
})
```

**Auto-Save Hook Pattern (from `src/hooks/use-auto-save.ts`):**
- Debounce with 2-second delay
- State hash comparison to avoid duplicate saves
- Fire-and-forget error handling
- Should test:
  - Debouncing behavior (verify save not called on every keystroke)
  - State hash comparison (verify save skipped if state unchanged)
  - Unmount flushing (verify debounce flushed when component unmounts)

**State Management Pattern (Zustand from `src/stores/calculation-wizard-store.ts`):**
- Test store creation
- Test state mutations
- Test persisted state loading from localStorage
- Test action creators (e.g., `applyPresetToProfile`, `scaleProfileToAnnual`)

## Validation Testing

**Framework:** Zod

**Current Validation Examples:**
- `src/lib/auth/credentials.ts`: `loginSchema` with email/password validation
- `src/actions/organizations.ts`: `organizationSchema` with URL/color/slug validation
- `src/actions/calculations.ts`: `saveDraftSchema` with complex nested validation

**Test Pattern:**
```typescript
describe('organizationSchema', () => {
  it('should validate valid organization', () => {
    const data = { name: 'Org', slug: 'org', primaryColor: '#3B82F6' }
    expect(organizationSchema.safeParse(data).success).toBe(true)
  })

  it('should reject short names', () => {
    const data = { name: 'X', slug: 'org', primaryColor: '#3B82F6' }
    const result = organizationSchema.safeParse(data)
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toContain('minst 2 tecken')
  })

  it('should reject invalid slug', () => {
    const data = { name: 'Org', slug: 'org_invalid', primaryColor: '#3B82F6' }
    const result = organizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject invalid color code', () => {
    const data = { name: 'Org', slug: 'org', primaryColor: 'not-a-color' }
    const result = organizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
```

## RBAC Testing

**Permission System Location:** `src/lib/auth/permissions.ts`

**Critical Tests Needed:**
- `hasPermission()` returns correct permissions for each role
- `requirePermission()` throws for denied permissions
- `canAccessOrg()` enforces organization boundaries
- Server Actions verify permissions (e.g., CLOSER cannot delete orgs)

**Test Template:**
```typescript
describe('Permission System', () => {
  describe('hasPermission', () => {
    it('should grant ORG_CREATE to SUPER_ADMIN only', () => {
      expect(hasPermission('SUPER_ADMIN', PERMISSIONS.ORG_CREATE)).toBe(true)
      expect(hasPermission('ORG_ADMIN', PERMISSIONS.ORG_CREATE)).toBe(false)
      expect(hasPermission('CLOSER', PERMISSIONS.ORG_CREATE)).toBe(false)
    })

    it('should grant CALCULATION_CREATE to all roles', () => {
      expect(hasPermission('SUPER_ADMIN', PERMISSIONS.CALCULATION_CREATE)).toBe(true)
      expect(hasPermission('ORG_ADMIN', PERMISSIONS.CALCULATION_CREATE)).toBe(true)
      expect(hasPermission('CLOSER', PERMISSIONS.CALCULATION_CREATE)).toBe(true)
    })
  })

  describe('canAccessOrg', () => {
    it('should allow SUPER_ADMIN to access any org', () => {
      expect(canAccessOrg('SUPER_ADMIN', null, 'org1')).toBe(true)
      expect(canAccessOrg('SUPER_ADMIN', 'orgA', 'orgZ')).toBe(true)
    })

    it('should restrict others to own org', () => {
      expect(canAccessOrg('ORG_ADMIN', 'org1', 'org1')).toBe(true)
      expect(canAccessOrg('ORG_ADMIN', 'org1', 'org2')).toBe(false)
      expect(canAccessOrg('CLOSER', 'org1', 'org1')).toBe(true)
      expect(canAccessOrg('CLOSER', 'org1', 'org2')).toBe(false)
    })
  })
})
```

## Recommended Testing Setup

**Install:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
npm install --save-dev @types/jest
```

**Configuration (jest.config.ts):**
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts(x)?', '**/?(*.)+(spec|test).ts(x)?'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**', // Skip Next.js app routing files
  ],
}
```

**Test Scripts to Add (package.json):**
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

---

*Testing analysis: 2026-01-26*
