import type { Metadata } from "next";
import { Check, UserPlus } from "lucide-react";
import { AuthCard, AuthDivider, AuthLink, GoogleButton, RegisterForm, type AccountType } from "@/components/auth";
import { isGoogleLoginEnabled } from "@/lib/auth/google";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Skapa konto",
  description: `Skapa ett gratis konto på ${brand.name}. Fota kvittot så sparar vi det säkert i sju år och håller koll på garantin åt dig.`,
  alternates: { canonical: "/registrera" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const perks = ["Gratis för privatpersoner", "Kvitton sparas i sju år", "Avsluta när du vill"];

/** Marketing links may preselect the business card with ?accountType=BUSINESS. */
function initialAccountType(value: string | string[] | undefined): AccountType {
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim().toUpperCase() === "BUSINESS" ? "BUSINESS" : "PRIVATE";
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const googleEnabled = isGoogleLoginEnabled();

  return (
    <AuthCard
      icon={UserPlus}
      title="Skapa ditt konto"
      description="Det tar en minut. Sedan fotar du ditt första kvitto och slipper leta i lådor och mail igen."
      footer={
        <>
          Har du redan ett konto? <AuthLink href="/logga-in">Logga in</AuthLink>
        </>
      }
    >
      <ul className="mb-6 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-600" aria-label="Det här ingår">
        {perks.map((perk) => (
          <li key={perk} className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-brand-600" aria-hidden />
            {perk}
          </li>
        ))}
      </ul>
      {googleEnabled ? (
        <div className="mb-6 space-y-4">
          <GoogleButton label="Skapa konto med Google" />
          <p className="text-center text-xs leading-relaxed text-ink-500">
            Genom att fortsätta med Google godkänner du{" "}
            <AuthLink href="/villkor" target="_blank" rel="noopener noreferrer">
              villkoren
            </AuthLink>{" "}
            och{" "}
            <AuthLink href="/integritet" target="_blank" rel="noopener noreferrer">
              integritetspolicyn
            </AuthLink>
            .
          </p>
          <AuthDivider>eller med e-post</AuthDivider>
        </div>
      ) : null}
      <RegisterForm initialAccountType={initialAccountType(params.accountType)} />
    </AuthCard>
  );
}
