import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { AuthCard, AuthLink, ForgotPasswordForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Glömt lösenord",
  description: "Skriv din e-postadress så skickar vi en länk där du kan välja ett nytt lösenord.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      icon={KeyRound}
      title="Glömt lösenordet?"
      description="Ingen fara. Skriv e-postadressen du registrerade dig med så skickar vi en länk där du väljer ett nytt."
      footer={
        <>
          Kom du på det? <AuthLink href="/logga-in">Tillbaka till inloggningen</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
