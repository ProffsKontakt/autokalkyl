import type { Metadata } from "next";
import { Check, UserPlus } from "lucide-react";
import { AuthCard, AuthLink, RegisterForm, type AccountType } from "@/components/auth";
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
      <RegisterForm initialAccountType={initialAccountType(params.accountType)} />
    </AuthCard>
  );
}
