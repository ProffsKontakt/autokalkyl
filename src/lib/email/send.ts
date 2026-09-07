import { brand } from "@/lib/brand";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends a transactional email.
 *
 * Providers (first configured wins):
 *  1. Resend – RESEND_API_KEY (+ EMAIL_FROM)
 *  2. n8n webhook – N8N_EMAIL_WEBHOOK_URL (POST JSON { to, subject, html, text })
 *  3. Console log (development fallback)
 */
export async function sendEmail(email: OutgoingEmail): Promise<{ ok: boolean; provider: string; error?: string }> {
  const from = process.env.EMAIL_FROM?.trim() || `${brand.name} <noreply@${brand.host}>`;

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [email.to], subject: email.subject, html: email.html, text: email.text }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[email] resend error", res.status, body);
        return { ok: false, provider: "resend", error: `Resend ${res.status}` };
      }
      return { ok: true, provider: "resend" };
    } catch (error) {
      console.error("[email] resend failed", error);
      return { ok: false, provider: "resend", error: String(error) };
    }
  }

  if (process.env.N8N_EMAIL_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.N8N_EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, ...email }),
      });
      if (!res.ok) return { ok: false, provider: "n8n", error: `n8n ${res.status}` };
      return { ok: true, provider: "n8n" };
    } catch (error) {
      console.error("[email] n8n failed", error);
      return { ok: false, provider: "n8n", error: String(error) };
    }
  }

  console.info(`[email] (no provider configured) To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
  return { ok: process.env.NODE_ENV !== "production", provider: "console" };
}

/** Minimal branded HTML wrapper for transactional mail. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="sv"><body style="margin:0;background:#f4f5f6;font-family:Inter,Helvetica,Arial,sans-serif;color:#111417">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f6;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
<tr><td style="font-size:20px;font-weight:700;color:#1c6f61;padding-bottom:16px">${brand.name}</td></tr>
<tr><td style="font-size:18px;font-weight:600;padding-bottom:12px">${title}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="font-size:12px;color:#6b7280;padding-top:24px">${brand.name} · ${brand.url}</td></tr>
</table></td></tr></table></body></html>`;
}
