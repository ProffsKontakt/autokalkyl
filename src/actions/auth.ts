'use server';

import { signIn, signOut } from '@/lib/auth/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { loginPasswordSchema } from '@/lib/validation/password';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/rate-limit';
import { logSecurityEvent, SecurityEventType } from '@/lib/audit/logger';

const loginSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: loginPasswordSchema,
});

export async function loginAction(data: z.infer<typeof loginSchema>) {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Ogiltig inmatning' };
  }

  const { email, password } = parsed.data;

  // Check rate limit before attempting login
  const rateLimit = checkLoginRateLimit(email);
  if (!rateLimit.success) {
    const minutesLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    await logSecurityEvent({
      type: SecurityEventType.LOGIN_RATE_LIMITED,
      email,
      metadata: { minutesLeft },
    });
    return {
      error: `För många inloggningsförsök. Försök igen om ${minutesLeft} minuter.`,
    };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    // Reset rate limit on successful login
    resetLoginRateLimit(email);
    await logSecurityEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      email,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      await logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILED,
        email,
        metadata: { errorType: error.type },
      });

      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Felaktig e-postadress eller lösenord' };
        default:
          return { error: 'Något gick fel. Försök igen.' };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  return { success: true };
}
