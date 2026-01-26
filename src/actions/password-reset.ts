'use server';

import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { sendPasswordResetEmail } from '@/lib/email/send-reset-email';
import { strongPasswordSchema } from '@/lib/validation/password';
import { checkPasswordResetRateLimit } from '@/lib/rate-limit';
import { logSecurityEvent, SecurityEventType } from '@/lib/audit/logger';

const requestSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmPassword'],
});

/**
 * Request a password reset email.
 *
 * Always returns success to prevent email enumeration attacks.
 * If user doesn't exist or is inactive, we silently do nothing.
 */
export async function requestPasswordReset(data: { email: string }) {
  const parsed = requestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = parsed.data.email;

  // Check rate limit before processing
  const rateLimit = checkPasswordResetRateLimit(email);
  if (!rateLimit.success) {
    await logSecurityEvent({
      type: SecurityEventType.PASSWORD_RESET_RATE_LIMITED,
      email,
    });
    // Still return success to prevent enumeration, but don't send email
    return { success: true };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration
  if (!user || !user.isActive) {
    return { success: true };
  }

  await logSecurityEvent({
    type: SecurityEventType.PASSWORD_RESET_REQUESTED,
    email,
    userId: user.id,
  });

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Build reset URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  // Send email via N8N (or log in dev)
  const emailResult = await sendPasswordResetEmail(
    user.email,
    resetUrl,
    user.name
  );

  if (emailResult.error) {
    console.error('Email send failed:', emailResult.error);
    // Still return success to prevent information leakage
  }

  return { success: true };
}

/**
 * Reset password using a valid token.
 *
 * Validates token, checks expiration, and updates password.
 * Marks token as used to prevent reuse.
 */
export async function resetPassword(data: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = resetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Find valid token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });

  if (!resetToken) {
    await logSecurityEvent({
      type: SecurityEventType.PASSWORD_RESET_FAILED,
      metadata: { reason: 'invalid_token' },
    });
    return { error: 'Ogiltig eller utgången länk' };
  }

  // Check expiration
  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    await logSecurityEvent({
      type: SecurityEventType.PASSWORD_RESET_FAILED,
      userId: resetToken.userId,
      email: resetToken.user.email,
      metadata: { reason: 'token_expired' },
    });
    return { error: 'Länken har gått ut. Begär en ny.' };
  }

  // Check if already used
  if (resetToken.usedAt) {
    await logSecurityEvent({
      type: SecurityEventType.PASSWORD_RESET_FAILED,
      userId: resetToken.userId,
      email: resetToken.user.email,
      metadata: { reason: 'token_already_used' },
    });
    return { error: 'Denna länk har redan använts' };
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  // Update password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logSecurityEvent({
    type: SecurityEventType.PASSWORD_RESET_SUCCESS,
    userId: resetToken.userId,
    email: resetToken.user.email,
  });

  return { success: true };
}

/**
 * Validate a reset token without consuming it.
 *
 * Used by the reset password page to check if the link is valid
 * before showing the password form.
 */
export async function validateResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { valid: false, error: 'Ogiltig länk' };
  }

  if (resetToken.expiresAt < new Date()) {
    return { valid: false, error: 'Länken har gått ut' };
  }

  if (resetToken.usedAt) {
    return { valid: false, error: 'Länken har redan använts' };
  }

  return { valid: true };
}
