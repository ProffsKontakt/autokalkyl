import type { ComponentType, ReactNode } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { GoogleButton, GoogleMark } from "@/components/auth/google-button";
import { SettingsSection } from "./settings-section";

function Method({
  icon: Icon,
  title,
  badge,
  action,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  badge: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-700" aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink-900">{title}</h3>
          {badge}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">{children}</p>
      </div>
      {action ? <div className="shrink-0 sm:pl-2">{action}</div> : null}
    </li>
  );
}

/**
 * Shows every way into the account. The point for the person reading it: nothing lives on this
 * device – log in anywhere and the receipts are there.
 */
export function LoginMethodsCard({
  email,
  hasPassword,
  googleEnabled,
  googleLinked,
}: {
  email: string;
  hasPassword: boolean;
  googleEnabled: boolean;
  googleLinked: boolean;
}) {
  return (
    <SettingsSection
      id="inloggning"
      icon={ShieldCheck}
      title="Inloggning"
      description="Så kommer du åt dina kvitton – på den här enheten och på nästa."
    >
      <ul className="divide-y divide-ink-100">
        <Method
          icon={KeyRound}
          title="E-post och lösenord"
          badge={hasPassword ? <Badge tone="success">Aktivt</Badge> : <Badge>Inget lösenord</Badge>}
        >
          {hasPassword ? (
            <>
              Logga in med <strong className="font-medium text-ink-900">{email}</strong> och ditt lösenord.
            </>
          ) : (
            <>
              Kontot skapades med Google. Vill du kunna logga in utan Google?{" "}
              <a href="#losenord" className="font-medium text-brand-700 hover:underline">
                Skapa ett lösenord
              </a>{" "}
              längre ned.
            </>
          )}
        </Method>

        <Method icon={Mail} title="Engångskod via e-post" badge={<Badge tone="success">Aktivt</Badge>}>
          Välj <strong className="font-medium text-ink-900">Få en engångskod</strong> på inloggningssidan så mailar vi en sexsiffrig kod till{" "}
          <strong className="font-medium text-ink-900">{email}</strong>. Praktiskt på en ny telefon eller dator.
        </Method>

        <Method
          icon={GoogleMark}
          title="Google"
          badge={
            !googleEnabled ? <Badge>Ej aktiverat</Badge> : googleLinked ? <Badge tone="success">Kopplat</Badge> : <Badge>Inte kopplat</Badge>
          }
          action={googleEnabled && !googleLinked ? <GoogleButton next="/app/installningar" label="Koppla Google" size="md" className="sm:w-auto" /> : null}
        >
          {!googleEnabled
            ? "Google-inloggning är inte aktiverad i den här installationen."
            : googleLinked
              ? "Logga in med ett klick via ditt Google-konto."
              : (
                <>
                  Logga in med det Google-konto som har adressen <strong className="font-medium text-ink-900">{email}</strong> så kopplas det automatiskt.
                </>
              )}
        </Method>
      </ul>

      <p className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900">
        Allt du sparar ligger i molnet, inte på enheten. Logga in på valfri telefon eller dator så finns alla kvitton, bilder och garantier där.
      </p>
    </SettingsSection>
  );
}
