import { prisma } from "@/lib/db/client";
import {
  LOGIN_CODE_MAX_ATTEMPTS,
  LOGIN_CODE_MAX_PER_WINDOW,
  LOGIN_CODE_TTL_MS,
  LOGIN_CODE_WINDOW_MS,
  LoginCodeError,
  generateLoginCode,
  hashLoginCode,
  loginCodeHashesMatch,
} from "./login-code";

export type IssuedLoginCode = { ok: true; code: string; expiresAt: Date } | { ok: false; reason: "rate_limited" };

/**
 * Creates a fresh code for the address. Older unused codes for the same address stop working, so the
 * newest e-mail is always the one that counts. Only the hash is stored.
 */
export async function issueLoginCode(email: string): Promise<IssuedLoginCode> {
  const now = Date.now();
  const recent = await prisma.loginCode.count({ where: { email, createdAt: { gte: new Date(now - LOGIN_CODE_WINDOW_MS) } } });
  if (recent >= LOGIN_CODE_MAX_PER_WINDOW) return { ok: false, reason: "rate_limited" };

  const code = generateLoginCode();
  const expiresAt = new Date(now + LOGIN_CODE_TTL_MS);
  await prisma.$transaction([
    prisma.loginCode.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: new Date(now) } }),
    prisma.loginCode.create({ data: { email, codeHash: hashLoginCode(email, code), expiresAt } }),
    // Housekeeping: a code is worthless a day after it expired.
    prisma.loginCode.deleteMany({ where: { expiresAt: { lt: new Date(now - 24 * 60 * 60 * 1000) } } }),
  ]);
  return { ok: true, code, expiresAt };
}

/** Verifies and consumes the newest code for the address. Throws LoginCodeError with a showable reason. */
export async function redeemLoginCode(email: string, code: string): Promise<void> {
  const now = new Date();
  const row = await prisma.loginCode.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!row || row.expiresAt <= now) throw new LoginCodeError("expired");
  if (row.attempts >= LOGIN_CODE_MAX_ATTEMPTS) throw new LoginCodeError("locked");

  if (!loginCodeHashesMatch(row.codeHash, hashLoginCode(email, code))) {
    const updated = await prisma.loginCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    throw new LoginCodeError(updated.attempts >= LOGIN_CODE_MAX_ATTEMPTS ? "locked" : "invalid");
  }

  // Atomic: two parallel submissions of the same code can only succeed once.
  const consumed = await prisma.loginCode.updateMany({ where: { id: row.id, consumedAt: null }, data: { consumedAt: now } });
  if (consumed.count !== 1) throw new LoginCodeError("used");
}
