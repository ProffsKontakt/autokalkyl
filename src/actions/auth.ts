'use server';

import { signIn, signOut } from '@/lib/auth/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginAction(data: z.infer<typeof loginSchema>) {
  try {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      return { error: 'Ogiltig inmatning' };
    }

    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Felaktig e-postadress eller losenord' };
        default:
          return { error: 'Nagot gick fel. Forsok igen.' };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  return { success: true };
}
