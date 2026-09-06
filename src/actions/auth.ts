"use server";

import { hash, compare } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { auth, loginCodeFailure, signIn, signOut, unstable_update } from "@/lib/auth/auth";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/auth/password";
import { newInboundToken } from "@/lib/auth/inbound-token";
import { DEMO_ACCOUNT_LOCKED, isDemoUserId } from "@/lib/auth/demo";
import { LOGIN_CODE_MESSAGES, LOGIN_CODE_TTL_MS, formatLoginCode, normalizeLoginCode } from "@/lib/auth/login-code";
import { issueLoginCode } from "@/lib/auth/login-code-store";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { sendEmail, emailLayout } from "@/lib/email/send";
import { brand } from "@/lib/brand";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}

function safeNext(next: unknown): string {
  // Only same-origin absolute paths: "/app/...", never "//evil", "/\\evil" or schemes.
  if (typeof next !== "string" || next.length > 500 || !/^\/(?![\/\\])/.test(next)) return "/app";
  return next;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

// -----------------------------------------------------------------------------
// Registration
// -----------------------------------------------------------------------------

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  accountType: z.enum(["PRIVATE", "BUSINESS"]).default("PRIVATE"),
  accept: z.literal("on", { message: "Du måste godkänna villkoren" }),
});

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  const rl = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "För många försök. Vänta en stund och försök igen." };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    accountType: formData.get("accountType") ?? "PRIVATE",
    accept: formData.get("accept"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Kontrollera uppgifterna.", fieldErrors };
  }

  const { name, email, password, accountType } = parsed.data;

  // Business accounts are on a waitlist for now – never create them silently.
  if (accountType === "BUSINESS") {
    redirect(`/foretag?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, error: "Det finns redan ett konto med den e-postadressen.", fieldErrors: { email: "E-postadressen används redan" } };
  }

  const passwordHash = await hash(password, 12);
  let user: { id: string } | null = null;
  for (let attempt = 0; attempt < 3 && !user; attempt++) {
    try {
      user = await prisma.user.create({
        data: { name, email, passwordHash, accountType, inboundToken: newInboundToken() },
        select: { id: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
        if (target.includes("email")) {
          return { ok: false, error: "Det finns redan ett konto med den e-postadressen.", fieldErrors: { email: "E-postadressen används redan" } };
        }
        // Unique collision on inboundToken is astronomically unlikely; retry once or twice.
        if (attempt < 2) continue;
      }
      throw error;
    }
  }
  if (!user) return { ok: false, error: "Kunde inte skapa kontot. Försök igen." };

  await audit(user.id, "auth.register", { details: { accountType } });

  void sendEmail({
    to: email,
    subject: `Välkommen till ${brand.name}`,
    text: `Hej ${name}!\n\nDitt konto är klart. Logga in på ${brand.url}/logga-in och skanna ditt första kvitto.\n\n${brand.name}`,
    html: emailLayout(
      `Välkommen, ${escapeHtml(name)}!`,
      `<p>Ditt konto är klart. Fota ditt första kvitto i appen eller maila det till din personliga kvittoadress som du hittar under Inställningar.</p><p><a href="${brand.url}/app" style="display:inline-block;background:#1c6f61;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600">Öppna ${brand.name}</a></p>`,
    ),
  }).catch(() => undefined);

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account created, but auto-login failed – send the user to login.
      redirect("/logga-in?registered=1");
    }
    throw error;
  }
  redirect("/app?welcome=1");
}

// -----------------------------------------------------------------------------
// Login / logout
// -----------------------------------------------------------------------------

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const rl = rateLimit(`login:${ip}:${email}`, 8, 15 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: `För många inloggningsförsök. Försök igen om ${Math.ceil(rl.retryAfterSeconds / 60)} min.` };
  if (!email || !password) return { ok: false, error: "Fyll i e-post och lösenord." };

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Fel e-post eller lösenord." };
    }
    throw error;
  }

  const session = await auth();
  if (session?.user?.id) await audit(session.user.id, "auth.login", { details: { method: "password" } });
  redirect(next);
}

// -----------------------------------------------------------------------------
// One-time code via e-mail ("engångskod") – lets people reach their receipts from a new device
// without remembering a password. Codes are only issued for existing accounts; the response
// is identical either way so the form never reveals whether an address is registered.
// -----------------------------------------------------------------------------

export type LoginCodeRequestResult = ActionResult<{ email: string }>;

export async function requestLoginCodeAction(_prev: LoginCodeRequestResult | null, formData: FormData): Promise<LoginCodeRequestResult> {
  const ip = await clientIp();
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Ange en giltig e-postadress." };
  const email = parsed.data;

  // Per address: 5 codes / 15 min (also enforced in the database). Per IP: generous, because offices and
  // mobile carriers put many people behind one address.
  const ipLimit = rateLimit(`code-request:${ip}`, 30, 15 * 60 * 1000);
  const emailLimit = rateLimit(`code-request-email:${email}`, 5, 15 * 60 * 1000);
  if (!ipLimit.ok || !emailLimit.ok) {
    return { ok: false, error: "Du har begärt för många koder. Vänta en stund och försök igen." };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  const minutes = Math.round(LOGIN_CODE_TTL_MS / 60_000);

  if (user) {
    const issued = await issueLoginCode(email);
    // The database limit (per address, across instances) is a silent backstop – no hint to the caller.
    if (issued.ok) {
      const pretty = formatLoginCode(issued.code);
      await sendEmail({
        to: email,
        subject: `${pretty} är din inloggningskod – ${brand.name}`,
        text: `Hej ${user.name}!\n\nDin engångskod för att logga in på ${brand.name} är:\n\n${pretty}\n\nKoden gäller i ${minutes} minuter och kan bara användas en gång.\n\nHar du inte försökt logga in kan du ignorera mailet – ingen kommer in utan koden.`,
        html: emailLayout(
          "Din inloggningskod",
          `<p>Hej ${escapeHtml(user.name)}! Skriv in koden på inloggningssidan för att fortsätta.</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1c6f61;margin:20px 0">${pretty}</p><p>Koden gäller i ${minutes} minuter och kan bara användas en gång.</p><p style="color:#6b7280;font-size:13px">Har du inte försökt logga in kan du ignorera mailet – ingen kommer in utan koden.</p>`,
        ),
      }).catch((error) => console.error("[auth] login code mail failed", error));
      await audit(user.id, "auth.login_code_requested");
    }
  } else {
    // Same timing and reply as above, but the mail says what to do instead of leaving the person waiting.
    await sendEmail({
      to: email,
      subject: `Inget konto hittades – ${brand.name}`,
      text: `Hej!\n\nNågon (troligen du) försökte logga in på ${brand.name} med den här adressen, men det finns inget konto kopplat till ${email}.\n\nSkapa ett gratis konto på ${brand.url}/registrera, eller logga in med den adress du registrerade dig med.\n\nVar det inte du kan du ignorera mailet.`,
      html: emailLayout(
        "Inget konto med den här adressen",
        `<p>Någon (troligen du) försökte logga in på ${brand.name} med <strong>${escapeHtml(email)}</strong>, men det finns inget konto kopplat till adressen.</p><p><a href="${brand.url}/registrera" style="display:inline-block;background:#1c6f61;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600">Skapa ett gratis konto</a></p><p style="color:#6b7280;font-size:13px">Har du redan ett konto? Logga in med adressen du registrerade dig med. Var det inte du kan du ignorera mailet.</p>`,
      ),
    }).catch((error) => console.error("[auth] no-account mail failed", error));
  }

  return { ok: true, data: { email } };
}

export async function verifyLoginCodeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Ange en giltig e-postadress." };
  const email = parsed.data;
  const next = safeNext(formData.get("next"));

  const rl = rateLimit(`code-verify:${ip}:${email}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: `För många försök. Försök igen om ${Math.ceil(rl.retryAfterSeconds / 60)} min.` };

  const code = normalizeLoginCode(formData.get("code"));
  if (!code) return { ok: false, error: "Skriv in de sex siffrorna från mailet." };

  try {
    await signIn("email-code", { email, code, redirect: false });
  } catch (error) {
    const failure = loginCodeFailure(error);
    if (failure) return { ok: false, error: LOGIN_CODE_MESSAGES[failure] };
    if (error instanceof AuthError) return { ok: false, error: LOGIN_CODE_MESSAGES.invalid };
    throw error;
  }

  const session = await auth();
  if (session?.user?.id) await audit(session.user.id, "auth.login", { details: { method: "code" } });
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const session = await auth();
  if (session?.user?.id) await audit(session.user.id, "auth.logout");
  await signOut({ redirectTo: "/" });
}

// -----------------------------------------------------------------------------
// Password reset
// -----------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordResetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  const rl = rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "För många försök. Vänta en stund." };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Ange en giltig e-postadress." };
  const email = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  // Always respond the same way to avoid leaking whether an account exists. The shared demo account is
  // reset on every deploy and its password must stay known, so it never gets a reset link.
  if (user && !isDemoUserId(user.id)) {
    const token = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${brand.url}/aterstall-losenord?token=${token}`;
    // Not awaited: keeps the response time identical whether or not the account exists.
    void sendEmail({
      to: email,
      subject: `Återställ ditt lösenord – ${brand.name}`,
      text: `Hej ${user.name}!\n\nKlicka på länken för att välja ett nytt lösenord (giltig i 60 minuter):\n${link}\n\nHar du inte begärt detta kan du ignorera mailet.`,
      html: emailLayout(
        "Återställ ditt lösenord",
        `<p>Hej ${escapeHtml(user.name)}! Klicka på knappen för att välja ett nytt lösenord. Länken är giltig i 60 minuter.</p><p><a href="${link}" style="display:inline-block;background:#1c6f61;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600">Välj nytt lösenord</a></p><p style="color:#6b7280;font-size:13px">Har du inte begärt detta kan du ignorera mailet.</p>`,
      ),
    }).catch((error) => console.error("[auth] reset mail failed", error));
    await audit(user.id, "auth.password_reset_requested");
  }
  return { ok: true };
}

export async function resetPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!token) return { ok: false, error: "Ogiltig länk." };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ogiltigt lösenord." };
  if (formData.get("password") !== formData.get("confirm")) return { ok: false, error: "Lösenorden matchar inte." };

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: "Länken är ogiltig eller har gått ut. Begär en ny." };
  }
  const passwordHash = await hash(parsed.data, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } }),
  ]);
  await audit(record.userId, "auth.password_reset");
  redirect("/logga-in?reset=1");
}

// -----------------------------------------------------------------------------
// Account settings
// -----------------------------------------------------------------------------

/** Changes the password – or sets the first one for an account created through Google. */
export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Du måste vara inloggad." };
  if (isDemoUserId(session.user.id)) return { ok: false, error: DEMO_ACCOUNT_LOCKED };
  const current = String(formData.get("current") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ogiltigt lösenord." };
  if (formData.get("password") !== formData.get("confirm")) return { ok: false, error: "Lösenorden matchar inte." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!user) return { ok: false, error: "Kontot hittades inte." };
  if (user.passwordHash && !(await compare(current, user.passwordHash))) return { ok: false, error: "Nuvarande lösenord är fel." };

  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: await hash(parsed.data, 12) } });
  await audit(session.user.id, "auth.password_changed", { details: { first: !user.passwordHash } });
  return { ok: true };
}

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Du måste vara inloggad." };
  if (isDemoUserId(session.user.id)) return { ok: false, error: DEMO_ACCOUNT_LOCKED };
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ogiltigt namn." };
  await prisma.user.update({ where: { id: session.user.id }, data: { name: parsed.data } });
  // Refresh the JWT so AppShell (which reads session.user.name) shows the new name immediately.
  await unstable_update({ user: { name: parsed.data } });
  return { ok: true };
}

export async function deleteAccountAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Du måste vara inloggad." };
  if (isDemoUserId(session.user.id)) return { ok: false, error: DEMO_ACCOUNT_LOCKED };
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true, email: true } });
  if (!user) return { ok: false, error: "Kontot hittades inte." };
  // Accounts without a password (Google sign-in) confirm with the word only – they are already authenticated.
  if (user.passwordHash && !(await compare(password, user.passwordHash))) return { ok: false, error: "Fel lösenord." };
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "RADERA") return { ok: false, error: 'Skriv "RADERA" för att bekräfta.' };

  // Cascades remove receipts, files, conversations and the user's audit events – keep an anonymous tombstone.
  await prisma.user.delete({ where: { id: session.user.id } });
  await audit(null, "account.deleted", { details: { emailHash: createHash("sha256").update(user.email).digest("hex").slice(0, 32) } });
  await signOut({ redirectTo: "/?deleted=1" });
  return { ok: true };
}
