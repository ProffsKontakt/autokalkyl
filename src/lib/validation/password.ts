import { z } from 'zod'

/**
 * Strong password requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const strongPasswordSchema = z
  .string()
  .min(12, 'Lösenord måste vara minst 12 tecken')
  .regex(/[A-Z]/, 'Måste innehålla en stor bokstav')
  .regex(/[a-z]/, 'Måste innehålla en liten bokstav')
  .regex(/[0-9]/, 'Måste innehålla en siffra')

/**
 * Optional strong password - for update operations where password may not be changed.
 * If provided, it must meet strong password requirements.
 */
export const optionalStrongPasswordSchema = z
  .string()
  .min(12, 'Lösenord måste vara minst 12 tecken')
  .regex(/[A-Z]/, 'Måste innehålla en stor bokstav')
  .regex(/[a-z]/, 'Måste innehålla en liten bokstav')
  .regex(/[0-9]/, 'Måste innehålla en siffra')
  .optional()
  .or(z.literal(''))
  .transform((val) => (val === '' ? undefined : val))

/**
 * Login password - accepts any non-empty password for login attempts.
 * Validation is done against stored hash, not schema.
 */
export const loginPasswordSchema = z.string().min(1, 'Lösenord krävs')
