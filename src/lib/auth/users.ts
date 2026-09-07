import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { newInboundToken } from "./inbound-token";

export type AccountType = "PRIVATE" | "BUSINESS";

export interface EnsuredUser {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  /** True when this call created the account. */
  created: boolean;
}

const select = { id: true, email: true, name: true, accountType: true, emailVerified: true } as const;

/**
 * Returns the account for a verified e-mail address (Google sign-in), creating a password-less private
 * account when none exists. Existing accounts are linked by address: the whole point of a second login
 * method is reaching the receipts you already have from a new device.
 */
export async function findOrCreateVerifiedUser(input: { email: string; name?: string | null }): Promise<EnsuredUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select });
  if (existing) {
    if (!existing.emailVerified) await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: new Date() } });
    return { id: existing.id, email: existing.email, name: existing.name, accountType: existing.accountType, created: false };
  }

  const name = displayNameFor(input.name, email);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const user = await prisma.user.create({
        data: { email, name, passwordHash: null, accountType: "PRIVATE", inboundToken: newInboundToken(), emailVerified: new Date() },
        select,
      });
      return { id: user.id, email: user.email, name: user.name, accountType: user.accountType, created: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
        if (target.includes("email")) {
          // Lost a race with a parallel sign-in for the same address – use that account.
          const raced = await prisma.user.findUnique({ where: { email }, select });
          if (raced) return { id: raced.id, email: raced.email, name: raced.name, accountType: raced.accountType, created: false };
        }
        // inboundToken collision: astronomically unlikely, retry with a new token.
        if (attempt < 2) continue;
      }
      throw error;
    }
  }
  throw new Error("Could not create the account");
}

/** Display name from the identity provider, or a readable fallback derived from the address ("anna.andersson@…" → "Anna Andersson"). */
export function displayNameFor(name: string | null | undefined, email: string): string {
  const given = name?.replace(/\s+/g, " ").trim() ?? "";
  if (given) return given.slice(0, 100);
  const local = (email.split("@")[0] ?? "").replace(/\+.*$/, "");
  const words = local.split(/[._\-\d]+/).filter(Boolean);
  const pretty = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return (pretty || local || "Användare").slice(0, 100);
}
