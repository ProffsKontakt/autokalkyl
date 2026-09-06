import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { AuthCard, AuthLink, FormNotice, LoginForm } from "@/components/auth";
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

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNext(firstParam(params.next));
  const registered = firstParam(params.registered) === "1";
  const reset = firstParam(params.reset) === "1";

  return (
    <AuthCard
      icon={LogIn}
      title="Välkommen tillbaka"
      description={
        next
          ? "Logga in så tar vi dig vidare dit du var på väg."
          : "Logga in för att se dina kvitton, garantier och bruksanvisningar."
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
      <LoginForm next={next} />
    </AuthCard>
  );
}
