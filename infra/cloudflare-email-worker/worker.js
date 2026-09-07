/**
 * Cloudflare Email Worker for Kvittera inbound receipts.
 *
 * Setup (Cloudflare dashboard, ~10 minutes):
 *  1. Add the domain (or the subdomain zone) to Cloudflare and enable Email Routing – it adds the MX records.
 *  2. Workers & Pages → Create → paste this file. Add two secrets under Settings → Variables:
 *       KVITTERA_URL     = https://kvittera.se        (or https://kalkyla.se until the domain switch)
 *       INBOUND_SECRET   = the value of INBOUND_EMAIL_SECRET in Vercel
 *  3. Email Routing → Routing rules → Catch-all address → Action "Send to a Worker" → this worker.
 *
 * Every mail to *@in.kvittera.se is forwarded as raw MIME to POST /api/inbound/email. The original
 * recipient is passed in ?to= so plus-addressing and rewritten headers never lose the token.
 */
export default {
  async email(message, env) {
    const url = new URL("/api/inbound/email", env.KVITTERA_URL);
    url.searchParams.set("to", message.to);
    const raw = await new Response(message.raw).arrayBuffer();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "message/rfc822",
        "x-inbound-secret": env.INBOUND_SECRET,
        "x-envelope-to": message.to,
        "x-envelope-from": message.from,
      },
      body: raw,
    });
    if (res.status >= 500) {
      // Let Cloudflare retry transient failures; 2xx/4xx are final.
      throw new Error(`Kvittera responded ${res.status}`);
    }
  },
};
