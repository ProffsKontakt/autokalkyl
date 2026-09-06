#!/usr/bin/env bash
# Sets every environment variable Kvittera needs in the Vercel project, for Production + Preview.
#
# Usage:
#   npx vercel login && npx vercel link          # once, choose the autokalkyl project
#   ANTHROPIC_API_KEY=sk-ant-... ./scripts/vercel-env.sh
#
# Existing variables are left untouched unless FORCE=1. DATABASE_URL and NEXTAUTH_SECRET/AUTH_SECRET
# are expected to exist already from the previous kalkyla.se deployment; the app accepts either name.
set -euo pipefail

APP_URL="${NEXT_PUBLIC_APP_URL:-https://kalkyla.se}"
BRAND="${NEXT_PUBLIC_BRAND_NAME:-Kvittera}"
INBOUND_DOMAIN="${INBOUND_EMAIL_DOMAIN:-in.kvittera.se}"
INBOUND_SECRET="${INBOUND_EMAIL_SECRET:-$(openssl rand -hex 24)}"
ANTHROPIC_KEY="${ANTHROPIC_API_KEY:-}"

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
echo "Redeploy afterwards: npx vercel --prod"
