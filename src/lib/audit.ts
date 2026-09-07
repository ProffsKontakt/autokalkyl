import { headers } from "next/headers";
import { prisma } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "auth.register"
  | "auth.login"
  | "auth.logout"
  | "auth.password_reset_requested"
  | "auth.password_reset"
  | "auth.password_changed"
  | "auth.login_code_requested"
  | "auth.google_linked"
  | "receipt.created"
  | "receipt.processed"
  | "receipt.viewed"
  | "receipt.updated"
  | "receipt.deleted"
  | "receipt.restored"
  | "receipt.purged"
  | "receipt.file_viewed"
  | "receipt.email_received"
  | "export.csv"
  | "chat.message"
  | "account.deleted";

/**
 * Writes an audit event (spårbarhet). Never throws – auditing must not break the main flow.
 * Safe to call from Server Actions and Route Handlers (reads request headers when available).
 */
export async function audit(
  userId: string | null,
  action: AuditAction,
  options: { receiptId?: string | null; details?: Prisma.InputJsonValue } = {},
): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
      userAgent = h.get("user-agent")?.slice(0, 300) || null;
    } catch {
      // headers() is unavailable outside a request scope (e.g. background jobs)
    }
    await prisma.auditEvent.create({
      data: {
        userId,
        receiptId: options.receiptId ?? null,
        action,
        details: options.details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit event", action, error);
  }
}
