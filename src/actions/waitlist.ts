"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { emailSchema, nameSchema } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "./auth";

const schema = z.object({
  name: nameSchema,
  email: emailSchema,
  company: z.string().trim().max(150).optional().transform((s) => (s ? s : null)),
  message: z.string().trim().max(1000).optional().transform((s) => (s ? s : null)),
  website: z.string().max(0).optional(), // honeypot
});

export async function joinWaitlistAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let ip = "unknown";
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  } catch {}
  const rl = rateLimit(`waitlist:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "För många försök. Vänta en stund." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? undefined,
    message: formData.get("message") ?? undefined,
    website: formData.get("website") ?? undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Kontrollera uppgifterna.", fieldErrors };
  }
  const { name, email, company, message } = parsed.data;
  await prisma.waitlistEntry.upsert({
    where: { email },
    create: { name, email, company, message },
    update: { name, company: company ?? undefined, message: message ?? undefined },
  });
  return { ok: true };
}
