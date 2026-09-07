import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { brand } from "@/lib/brand";
import { formatDate } from "@/lib/utils";
import { Badge, Hint, Input, Label } from "@/components/ui";
import { SettingsSection } from "./settings-section";
import { ProfileForm } from "./profile-form";

export type AccountType = "PRIVATE" | "BUSINESS";

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  PRIVATE: "Privatperson",
  BUSINESS: "Företag",
};

export function ProfileCard({
  user,
  receiptCount,
}: {
  user: { name: string; email: string; accountType: AccountType; createdAt: Date };
  receiptCount: number;
}) {
  const accountLabel = ACCOUNT_TYPE_LABEL[user.accountType];
  return (
    <SettingsSection
      id="profil"
      icon={UserRound}
      title="Profil"
      description="Dina kontouppgifter."
      aside={<Badge tone={user.accountType === "BUSINESS" ? "dark" : "brand"}>{accountLabel}</Badge>}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileForm initialName={user.name} />

        <div className="space-y-4">
          <div>
            <Label htmlFor="profile-email">E-post</Label>
            <Input
              id="profile-email"
              type="email"
              value={user.email}
              readOnly
              aria-readonly="true"
              className="bg-ink-50 text-ink-600"
            />
            <Hint>
              Används när du loggar in och kan inte ändras här. Behöver du byta? Hör av dig till{" "}
              <a href={`mailto:${brand.supportEmail}`} className="font-medium text-brand-700 hover:underline">
                {brand.supportEmail}
              </a>
              .
            </Hint>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-ink-50 px-3 py-2.5">
              <dt className="text-xs text-ink-500">Kontotyp</dt>
              <dd className="mt-0.5 font-semibold text-ink-900">{accountLabel}</dd>
            </div>
            <div className="rounded-xl bg-ink-50 px-3 py-2.5">
              <dt className="text-xs text-ink-500">Medlem sedan</dt>
              <dd className="mt-0.5 font-semibold text-ink-900">{formatDate(user.createdAt)}</dd>
            </div>
            <div className="rounded-xl bg-ink-50 px-3 py-2.5">
              <dt className="text-xs text-ink-500">Sparade kvitton</dt>
              <dd className="mt-0.5 font-semibold text-ink-900">{receiptCount}</dd>
            </div>
          </dl>

          {user.accountType === "PRIVATE" ? (
            <p className="text-sm text-ink-600">
              Har du företag?{" "}
              <Link href="/foretag" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
                Anmäl intresse för företagsversionen
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </SettingsSection>
  );
}
