import { createHash, randomInt, timingSafeEqual } from "node:crypto";

/**
 * One-time login codes ("engångskod"): six digits mailed to the address, valid for ten minutes.
 * Pure helpers live here (unit-tested); the database side is in login-code-store.ts.
 */
export const LOGIN_CODE_LENGTH = 6;
export const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
/** Wrong guesses allowed per code before it is locked (1e6 combinations / 5 guesses ≈ nothing). */
export const LOGIN_CODE_MAX_ATTEMPTS = 5;
/** Codes per address per window – database-backed, so it holds across serverless instances. */
export const LOGIN_CODE_MAX_PER_WINDOW = 5;
export const LOGIN_CODE_WINDOW_MS = 15 * 60 * 1000;

export type LoginCodeFailure = "invalid" | "expired" | "locked" | "used";

/** Failure with a reason that is safe to show: none of them reveal whether the account exists. */
export class LoginCodeError extends Error {
  readonly reason: LoginCodeFailure;
  constructor(reason: LoginCodeFailure) {
    super(`login code ${reason}`);
    this.name = "LoginCodeError";
    this.reason = reason;
  }
}

export const LOGIN_CODE_MESSAGES: Record<LoginCodeFailure, string> = {
  invalid: "Fel kod. Kontrollera siffrorna och försök igen.",
  expired: "Koden har gått ut eller är inte längre giltig. Begär en ny kod.",
  locked: "För många felaktiga försök. Begär en ny kod.",
  used: "Koden har redan använts. Begär en ny kod.",
};

export function isLoginCodeFailure(value: unknown): value is LoginCodeFailure {
  return typeof value === "string" && value in LOGIN_CODE_MESSAGES;
}

/** Uniformly random six-digit code, zero-padded ("004812" is a valid code). */
export function generateLoginCode(): string {
  return String(randomInt(0, 10 ** LOGIN_CODE_LENGTH)).padStart(LOGIN_CODE_LENGTH, "0");
}

/** Accepts "123 456", "123-456", " 123456 " …; returns the six digits or null. */
export function normalizeLoginCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D+/g, "");
  return digits.length === LOGIN_CODE_LENGTH ? digits : null;
}

/** "123 456" – easier to read in the e-mail. */
export function formatLoginCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/** The stored hash binds the code to the address, so a code issued for one address never works for another. */
export function hashLoginCode(email: string, code: string): string {
  return createHash("sha256").update(`${email.trim().toLowerCase()}\n${code}`).digest("hex");
}

export function loginCodeHashesMatch(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}
