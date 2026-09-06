# Kvittera – trygg digital kvittohantering

Fota, ladda upp eller maila in kvitton. AI:n läser av butik, datum, belopp, artikelnummer och garantitext. Allt sparas i sju år, är sökbart och exporterbart – och en AI-assistent hjälper dig med garantier, reklamationsrätt, bruksanvisningar och felsökning.

Byggd för att köras på **kalkyla.se idag och byta till kvittera.se utan kodändringar** (varumärke och domän styrs av miljövariabler).

## Stack

- Next.js 16 (App Router, React 19, TypeScript strict), Tailwind CSS v4, `motion`
- PostgreSQL (Neon) via Prisma 7 + `@prisma/adapter-pg`
- Auth.js v5 (e-post + lösenord, JWT-sessioner)
- Anthropic Claude (`claude-opus-5`) för kvittotolkning (vision + structured outputs) och assistenten (web search + web fetch)
- Kvittobilder lagras krypterat i databasen och serveras endast till ägaren via `/api/files/[id]`

## Kom igång lokalt

```bash
cp .env.example .env.local        # fyll i DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY
npm install
npx prisma migrate deploy         # skapar schemat (tar även bort den gamla kalkyla-databasen om den finns)
npm run dev                       # http://localhost:3001
```

Utan `ANTHROPIC_API_KEY` fungerar allt utom AI-tolkning och assistenten: kvitton sparas med status *Behöver granskas* och kan fyllas i manuellt.

## Miljövariabler

| Variabel | Krävs | Beskrivning |
| --- | --- | --- |
| `DATABASE_URL` | ja | Neon pooled connection string |
| `AUTH_SECRET` | ja | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | för AI | Anthropic API-nyckel |
| `ANTHROPIC_MODEL` | nej | Standard `claude-opus-5` |
| `NEXT_PUBLIC_APP_URL` | ja | `https://kalkyla.se` nu, `https://kvittera.se` sen |
| `NEXT_PUBLIC_BRAND_NAME` | nej | Standard `Kvittera` |
| `INBOUND_EMAIL_DOMAIN` | för e-post | Domänen för användarnas kvittoadresser, t.ex. `in.kvittera.se` |
| `INBOUND_EMAIL_SECRET` | för e-post | Delad hemlighet som e-postleverantören skickar till webhooken |
| `RESEND_API_KEY`, `EMAIL_FROM` | nej | Utgående mail (lösenordsåterställning). Alternativ: `N8N_EMAIL_WEBHOOK_URL` |

## Deploy på Vercel

1. Sätt miljövariablerna ovan i projektet.
2. `vercel-build` kör `prisma generate && prisma migrate deploy && next build` – databasen migreras automatiskt vid deploy. **Första deployen tar bort alla tabeller från den gamla batterikalkylatorn** (se `prisma/migrations/20260906000000_init_kvittera`).
3. `vercel.json` sätter region `arn1` (Stockholm) och Fluid compute; `/api/chat` har `maxDuration = 300`.

## Inkommande kvitton via e-post

Varje användare får en unik adress `kvitto-xxxxxxxxxx@<INBOUND_EMAIL_DOMAIN>`. Peka domänens MX till valfri leverantör och låt den POST:a till `https://<din-domän>/api/inbound/email` med hemligheten i headern `x-inbound-secret` (eller `?secret=`, Basic-auth-lösenord eller `Authorization: Bearer`). Endpointen förstår:

- **Postmark** inbound webhook (JSON med base64-bilagor)
- **SendGrid Inbound Parse** och **Mailgun routes** (multipart/form-data)
- **Cloudflare Email Workers** eller annan vidarebefordran av rå MIME (`Content-Type: message/rfc822`; lägg gärna mottagaren i `?to=`)
- generisk JSON `{ to, from, subject, text, html, attachments: [{ filename, contentType, content }] }` (t.ex. från n8n)

Bilder (≥ 12 kB) och PDF:er blir kvittofiler; saknas bilagor tolkas mailets HTML/text (e-kvitton och orderbekräftelser).

## Skript

- `npm run typecheck` / `npm run lint` / `npm test` (vitest) / `npm run test:e2e` (Playwright, kräver körande server och `BASE_URL`)
- `npm run db:migrate` – `prisma migrate deploy`
- `CONFIRM_RESET=yes npm run db:reset-legacy` – nödfall: rensar gammalt schema och migrationshistorik manuellt

## Rättsligt

Assistentens svar är vägledning, inte juridisk rådgivning. Konsumenträttigheter som anges bygger på konsumentköplagen (2022:260) och distansavtalslagen; BankID-inloggning och e-signering är planerade, inte implementerade.
