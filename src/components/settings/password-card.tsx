import { KeyRound } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { PasswordForm } from "./password-form";

export function PasswordCard() {
  return (
    <SettingsSection id="losenord" icon={KeyRound} title="Lösenord" description="Välj gärna en lång fras som du lätt kommer ihåg.">
      <PasswordForm />
    </SettingsSection>
  );
}
