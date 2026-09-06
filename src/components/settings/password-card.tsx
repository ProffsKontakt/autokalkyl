import { KeyRound } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { PasswordForm } from "./password-form";

export function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  return (
    <SettingsSection
      id="losenord"
      icon={KeyRound}
      title={hasPassword ? "Lösenord" : "Skapa lösenord"}
      description={
        hasPassword
          ? "Välj gärna en lång fras som du lätt kommer ihåg."
          : "Kontot har inget lösenord ännu (du loggar in med Google eller engångskod). Skapa ett om du vill kunna logga in utan dem."
      }
    >
      <PasswordForm hasPassword={hasPassword} />
    </SettingsSection>
  );
}
