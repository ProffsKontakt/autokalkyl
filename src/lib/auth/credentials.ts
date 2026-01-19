import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Login validation schema.
 *
 * Validates email format and minimum password length.
 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Validates user credentials and returns user data for JWT.
 *
 * @param email - User email address
 * @param password - User password (plaintext, compared against hash)
 * @returns User data for JWT token, or null if invalid
 */
export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    orgSlug: user.organization?.slug ?? null,
  };
}
