/**
 * Brand configuration.
 *
 * The site is built to be re-pointed from kalkyla.se to kvittera.se (or any other domain)
 * without code changes: everything user-facing reads from here.
 */

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://kvittera.se";

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "kvittera.se";
  }
}

export const brand = {
  /** Display name, e.g. "Kvittera" */
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Kvittera",
  /** Absolute public URL without trailing slash */
  url: rawAppUrl.replace(/\/+$/, ""),
  /** Host name, e.g. "kvittera.se" */
  host: hostOf(rawAppUrl),
  tagline: "Alla dina kvitton. Alltid till hands.",
  description:
    "Fota, ladda upp eller maila in dina kvitton. Vi sparar dem säkert i sju år och hjälper dig hålla koll på garantier, reklamationsrätt och bruksanvisningar med hjälp av AI.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hej@kvittera.se",
} as const;

/** Domain used for each user's unique inbound receipt address. Server-only (no NEXT_PUBLIC_). */
export function inboundEmailDomain(): string {
  return process.env.INBOUND_EMAIL_DOMAIN?.trim() || `in.${brand.host}`;
}

/** Builds the full inbound address for a user's inbound token. */
export function inboundAddressFor(token: string): string {
  return `${token}@${inboundEmailDomain()}`;
}
