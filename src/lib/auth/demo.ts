/**
 * The shared demo/test account ("Anna Andersson").
 *
 * It is (re)created on every deploy by scripts/seed-demo-on-deploy.mjs (opt out with DEMO_ACCOUNT=0) so
 * anyone can try the app with realistic receipts. Because the account is shared and reset, the parts that
 * would lock the next visitor out – password, name, deletion – are frozen.
 */
export const DEMO_USER_ID = "usr_demo_kvittera";
export const DEMO_INBOUND_TOKEN = "kvitto-demo7k2m4p";
export const DEMO_DEFAULT_EMAIL = "demo@kvittera.se";
export const DEMO_DEFAULT_PASSWORD = "Demo1234!";

export function demoAccountEmail(): string {
  return process.env.DEMO_ACCOUNT_EMAIL?.trim().toLowerCase() || DEMO_DEFAULT_EMAIL;
}

export function demoAccountPassword(): string {
  return process.env.DEMO_ACCOUNT_PASSWORD?.trim() || DEMO_DEFAULT_PASSWORD;
}

export function isDemoUserId(userId: string | null | undefined): boolean {
  return userId === DEMO_USER_ID;
}

export const DEMO_ACCOUNT_LOCKED =
  "Demokontot delas av alla som testar och återställs vid varje driftsättning. Lösenord, namn och radering är därför låsta – skapa ett eget konto om du vill testa det.";
