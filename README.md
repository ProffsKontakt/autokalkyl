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
| `RESEND_API_KEY`, `EMAIL_FROM` | för engångskod | Utgående mail (engångskoder, lösenordsåterställning). Alternativ: `N8N_EMAIL_WEBHOOK_URL` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | för Google | OAuth-klient från Google Cloud Console (se *Inloggning*) |
| `DEMO_ACCOUNT`, `DEMO_ACCOUNT_EMAIL`, `DEMO_ACCOUNT_PASSWORD` | nej | Demokontot skapas vid varje deploy; `DEMO_ACCOUNT=0` stänger av. Standard `demo@kvittera.se` / `Demo1234!` |

## Inloggning

Allt sparas i databasen, inget på enheten – logga in på en ny telefon eller dator så finns kvittona där. Tre vägar in:

- **E-post + lösenord** (registrering, byt lösenord, återställ via mail).
- **Engångskod via e-post** – "Få en engångskod" på `/logga-in` (eller `/logga-in?method=code`). Sex siffror, giltiga i 10 minuter, max 5 felförsök per kod, max 5 koder per adress och kvart. Kräver utgående e-post (`RESEND_API_KEY`); utan den loggas koden bara till konsolen i utveckling. Adresser utan konto får ett mail som pekar till registreringen, så formuläret avslöjar aldrig om ett konto finns.
- **Google** – visas bara när `GOOGLE_CLIENT_ID` och `GOOGLE_CLIENT_SECRET` är satta. Konton kopplas ihop på verifierad e-postadress: finns adressen redan loggas den användaren in, annars skapas ett lösenordslöst privatkonto (lösenord kan läggas till under Inställningar → Skapa lösenord).

Skapa Google-klienten i [Google Cloud Console](https://console.cloud.google.com/apis/credentials): *Create credentials → OAuth client ID → Web application*. Lägg till varje domän som *Authorized JavaScript origin* (`https://kvittera.se`, `https://kalkyla.se` tills bytet, `http://localhost:3001` lokalt) och motsvarande `…/api/auth/callback/google` som *Authorized redirect URI*. Vercel-previews behöver sin egen origin/redirect-URI om Google ska testas där. Är OAuth-samtyckesskärmen i "Testing"-läge kan bara tillagda testanvändare logga in – publicera den innan lansering.

## Demokonto

`vercel-build` kör `scripts/seed-demo-on-deploy.mjs` som skapar (och vid varje deploy återställer) testkontot **demo@kvittera.se / Demo1234!** – "Anna Andersson" med åtta kvitton (kvittofoton, en solcellsfaktura som PDF, ett e-kvitto), garantier och en AI-konversation. Kontot delas av alla som testar, så lösenord, namn och radering är låsta i appen. Stäng av med `DEMO_ACCOUNT=0`, byt uppgifter med `DEMO_ACCOUNT_EMAIL` / `DEMO_ACCOUNT_PASSWORD`. Kvittofilerna är förrenderade i `scripts/demo/fixtures` – kör `npm run demo:render` (Chromium) efter ändringar i `scripts/demo/receipts.ts`.

## Deploy på Vercel

1. Sätt miljövariablerna ovan i projektet.
2. `vercel-build` kör `prisma generate`, migrationerna, demokontot och `next build` – databasen migreras automatiskt vid deploy. **Första deployen tar bort alla tabeller från den gamla batterikalkylatorn** (se `prisma/migrations/20260906000000_init_kvittera`).
3. `vercel.json` sätter region `arn1` (Stockholm) och Fluid compute; `/api/chat` har `maxDuration = 300`.

## Sätta miljövariabler i Vercel

`scripts/vercel-env.sh` sätter alla variabler för Production och Preview med Vercel CLI (`npx vercel login && npx vercel link` först). Befintliga `DATABASE_URL` och `NEXTAUTH_SECRET` från kalkyla-deployen återanvänds – appen accepterar både `AUTH_SECRET` och `NEXTAUTH_SECRET`.

```bash
ANTHROPIC_API_KEY=sk-ant-... RESEND_API_KEY=re_... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... ./scripts/vercel-env.sh
```

Utelämnade nycklar hoppas över med en varning (AI, engångskod respektive Google förblir då avstängda).

## Inkommande kvitton via e-post

Varje användare får en unik adress `kvitto-xxxxxxxxxx@<INBOUND_EMAIL_DOMAIN>`. Peka domänens MX till valfri leverantör och låt den POST:a till `https://<din-domän>/api/inbound/email` med hemligheten i headern `x-inbound-secret` (eller `?secret=`, Basic-auth-lösenord eller `Authorization: Bearer`). Endpointen förstår:

- **Postmark** inbound webhook (JSON med base64-bilagor)
- **SendGrid Inbound Parse** och **Mailgun routes** (multipart/form-data)
- **Cloudflare Email Workers** eller annan vidarebefordran av rå MIME (`Content-Type: message/rfc822`; lägg gärna mottagaren i `?to=`)
- generisk JSON `{ to, from, subject, text, html, attachments: [{ filename, contentType, content }] }` (t.ex. från n8n)

Bilder (≥ 12 kB) och PDF:er blir kvittofiler; saknas bilagor tolkas mailets HTML/text (e-kvitton och orderbekräftelser).

Enklaste vägen (gratis): Cloudflare Email Routing med catch-all till workern i `infra/cloudflare-email-worker/worker.js` – instruktioner står i filen.

## Demo- och testläge för AI

`AI_MOCK=1` (ignoreras på Vercel) gör att kvittotolkning och assistenten svarar med inbyggda exempel utan Anthropic-anrop. `npm run seed:demo` skapar demokontot lokalt (samma som vid deploy). Används för produktfilmen, skärmdumpar och e2e-tester.

## Skript

- `npm run typecheck` / `npm run lint` / `npm test` (vitest) / `npm run test:e2e` (Playwright, kräver körande server, `BASE_URL` och `DATABASE_URL` till samma databas)
- `npm run seed:demo` – skapar/återställer demokontot; `npm run demo:render` – renderar om kvittofilerna i `scripts/demo/fixtures`
- `npm run db:migrate` – `prisma migrate deploy`
- `CONFIRM_RESET=yes npm run db:reset-legacy` – nödfall: rensar gammalt schema och migrationshistorik manuellt

## Rättsligt

Assistentens svar är vägledning, inte juridisk rådgivning. Konsumenträttigheter som anges bygger på konsumentköplagen (2022:260) och distansavtalslagen; BankID-inloggning och e-signering är planerade, inte implementerade.
