import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { AuthCard, AuthLink, FormNotice, LoginOptions, type LoginMode } from "@/components/auth";
import { isGoogleLoginEnabled } from "@/lib/auth/google";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Logga in",
  description: `Logga in på ${brand.name} för att se dina kvitton, garantier och bruksanvisningar.`,
  alternates: { canonical: "/logga-in" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single.trim() : "";
}

/** Only relative, same-origin paths are allowed as a post-login destination (the action re-checks this). */
function safeNext(value: string): string | undefined {
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return undefined;
  return value.slice(0, 500);
}

/** Auth.js sends OAuth failures back here as ?error=…; translate the ones a person can act on. */
function authErrorMessage(code: string): string | null {
  if (!code) return null;
  switch (code) {
    case "GoogleEmailUnverified":
      return "Google har inte verifierat e-postadressen på det kontot, så vi kan inte använda den. Logga in med lösenord eller engångskod i stället.";
    case "AccessDenied":
      return "Inloggningen nekades. Försök igen eller använd en annan inloggningsmetod.";
    case "Configuration":
      return "Google-inloggningen är inte färdigkonfigurerad. Logga in med e-post så länge.";
    case "CredentialsSignin":
      return "Fel e-post eller lösenord.";
    default:
      return "Inloggningen avbröts eller misslyckades. Försök igen.";
  }
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNext(firstParam(params.next));
  const registered = firstParam(params.registered) === "1";
  const reset = firstParam(params.reset) === "1";
  const authError = authErrorMessage(firstParam(params.error));
  const initialMode: LoginMode = firstParam(params.method) === "code" ? "code" : "password";
  const initialEmail = firstParam(params.email).slice(0, 254);

  return (
    <AuthCard
      icon={LogIn}
      title="Välkommen tillbaka"
      description={
        next
          ? "Logga in så tar vi dig vidare dit du var på väg."
          : "Logga in för att se dina kvitton, garantier och bruksanvisningar – på vilken enhet som helst."
      }
      footer={
        <>
          Inget konto ännu? <AuthLink href="/registrera">Skapa ett gratis</AuthLink>
        </>
      }
    >
      {registered ? (
        <FormNotice tone="success" className="mb-5">
          Kontot är skapat – logga in för att komma igång.
        </FormNotice>
      ) : null}
      {reset ? (
        <FormNotice tone="success" className="mb-5">
          Lösenordet är uppdaterat. Logga in med ditt nya lösenord.
        </FormNotice>
      ) : null}
      {authError ? (
        <FormNotice tone="error" className="mb-5">
          {authError}
        </FormNotice>
      ) : null}
      <LoginOptions next={next} googleEnabled={isGoogleLoginEnabled()} initialMode={initialMode} initialEmail={initialEmail} />
    </AuthCard>
  );
}
