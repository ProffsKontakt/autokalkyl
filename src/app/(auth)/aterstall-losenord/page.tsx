import type { Metadata } from "next";
import { LockKeyhole, Unlink } from "lucide-react";
import { AuthCard, AuthLink, ResetPasswordForm } from "@/components/auth";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Välj nytt lösenord",
  description: "Välj ett nytt lösenord för ditt konto.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Tokens are base64url from the server; anything else is treated as a broken link. */
function safeToken(value: string | string[] | undefined): string | null {
  const single = Array.isArray(value) ? value[0] : value;
  const token = typeof single === "string" ? single.trim() : "";
  return /^[A-Za-z0-9_-]{16,256}$/.test(token) ? token : null;
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = safeToken(params.token);

  if (!token) {
    return (
      <AuthCard
        icon={Unlink}
        iconTone="danger"
        title="Länken fungerar inte"
        description="Länken saknar sin kod. Den kan ha klippts av i mailet eller ha gått ut – länkar gäller i 60 minuter. Begär en ny så fixar vi det."
        footer={
          <>
            Kom du på lösenordet? <AuthLink href="/logga-in">Logga in</AuthLink>
          </>
        }
      >
        <ButtonLink href="/glomt-losenord" size="lg" className="w-full">
          Begär en ny länk
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={LockKeyhole}
      title="Välj ett nytt lösenord"
      description="Skriv ditt nya lösenord två gånger. Efteråt loggar du in som vanligt."
      footer={
        <>
          Fungerar inte länken? <AuthLink href="/glomt-losenord">Begär en ny</AuthLink>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
