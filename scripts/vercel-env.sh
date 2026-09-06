#!/usr/bin/env bash
# Sets every environment variable Kvittera needs in the Vercel project, for Production + Preview.
#
# Usage:
#   npx vercel login && npx vercel link          # once, choose the autokalkyl project
#   ANTHROPIC_API_KEY=sk-ant-... RESEND_API_KEY=re_... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... ./scripts/vercel-env.sh
#
# Optional inputs: RESEND_API_KEY + EMAIL_FROM (one-time login codes, password reset), GOOGLE_CLIENT_ID +
# GOOGLE_CLIENT_SECRET (Google sign-in), DEMO_ACCOUNT_PASSWORD (demo account). Missing ones are skipped
# with a warning – the matching feature simply stays off.
#
# Existing variables are left untouched unless FORCE=1. DATABASE_URL and NEXTAUTH_SECRET/AUTH_SECRET
# are expected to exist already from the previous kalkyla.se deployment; the app accepts either name.
set -euo pipefail

APP_URL="${NEXT_PUBLIC_APP_URL:-https://kalkyla.se}"
BRAND="${NEXT_PUBLIC_BRAND_NAME:-Kvittera}"
INBOUND_DOMAIN="${INBOUND_EMAIL_DOMAIN:-in.kvittera.se}"
INBOUND_SECRET="${INBOUND_EMAIL_SECRET:-$(openssl rand -hex 24)}"
ANTHROPIC_KEY="${ANTHROPIC_API_KEY:-}"
RESEND_KEY="${RESEND_API_KEY:-}"
MAIL_FROM="${EMAIL_FROM:-$BRAND <noreply@${APP_URL#https://}>}"
GOOGLE_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_SECRET="${GOOGLE_CLIENT_SECRET:-}"
DEMO_PASSWORD="${DEMO_ACCOUNT_PASSWORD:-}"

have() { npx vercel env ls "$1" 2>/dev/null | grep -q "$2" ; }
setvar() { # name value env
  local name="$1" value="$2" target="$3"
  if [ "${FORCE:-0}" != "1" ] && npx vercel env ls "$target" 2>/dev/null | grep -qE "^ *$name "; then
    echo "skip   $name ($target) – already set (FORCE=1 to overwrite)"; return
  fi
  printf '%s' "$value" | npx vercel env add "$name" "$target" --force >/dev/null
  echo "set    $name ($target)"
}

for target in production preview; do
  setvar NEXT_PUBLIC_APP_URL "$APP_URL" "$target"
  setvar NEXT_PUBLIC_BRAND_NAME "$BRAND" "$target"
  setvar INBOUND_EMAIL_DOMAIN "$INBOUND_DOMAIN" "$target"
  setvar INBOUND_EMAIL_SECRET "$INBOUND_SECRET" "$target"
  if [ -n "$ANTHROPIC_KEY" ]; then setvar ANTHROPIC_API_KEY "$ANTHROPIC_KEY" "$target"; else echo "warn   ANTHROPIC_API_KEY not provided – AI features stay off until it is set"; fi
  if [ -n "$RESEND_KEY" ]; then
    setvar RESEND_API_KEY "$RESEND_KEY" "$target"
    setvar EMAIL_FROM "$MAIL_FROM" "$target"
  else
    echo "warn   RESEND_API_KEY not provided – one-time login codes and password reset mails cannot be sent"
  fi
  if [ -n "$GOOGLE_ID" ] && [ -n "$GOOGLE_SECRET" ]; then
    setvar GOOGLE_CLIENT_ID "$GOOGLE_ID" "$target"
    setvar GOOGLE_CLIENT_SECRET "$GOOGLE_SECRET" "$target"
  else
    echo "warn   GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not provided – the Google button stays hidden"
  fi
  if [ -n "$DEMO_PASSWORD" ]; then setvar DEMO_ACCOUNT_PASSWORD "$DEMO_PASSWORD" "$target"; fi
  if ! npx vercel env ls "$target" 2>/dev/null | grep -qE "^ *(AUTH_SECRET|NEXTAUTH_SECRET) "; then
    setvar AUTH_SECRET "$(openssl rand -base64 32)" "$target"
  fi
  if ! npx vercel env ls "$target" 2>/dev/null | grep -qE "^ *DATABASE_URL "; then
    echo "warn   DATABASE_URL missing in $target – add the Neon pooled connection string manually"
  fi
done

echo
echo "INBOUND_EMAIL_SECRET = $INBOUND_SECRET"
echo "Use the same value as INBOUND_SECRET in the Cloudflare Email Worker (infra/cloudflare-email-worker/worker.js)."
echo "Google: add https://<domain>/api/auth/callback/google as an authorized redirect URI in Google Cloud Console."
echo "Redeploy afterwards: npx vercel --prod"
