import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { DeleteAccountDialog } from "./delete-account-dialog";

export function DangerZoneCard({ email }: { email: string }) {
  return (
    <SettingsSection id="farozon" icon={TriangleAlert} tone="danger" title="Farozon" description="Det som inte går att ångra.">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-2 text-sm text-ink-600">
          <p>
            <span className="font-semibold text-ink-900">Radera kontot.</span> Allt raderas permanent och på en gång: dina kvitton, bilder och PDF:er,
            garantier, chatthistorik, din kvittoadress och själva kontot. Vi kan inte återskapa något i efterhand.
          </p>
          <p>
            Vill du bara ta bort enstaka kvitton? Det gör du under{" "}
            <Link href="/app/kvitton" className="font-medium text-brand-700 hover:underline">
              Kvitton
            </Link>{" "}
            – de hamnar i{" "}
            <Link href="/app/papperskorg" className="font-medium text-brand-700 hover:underline">
              papperskorgen
            </Link>{" "}
            och kan återställas. Och ta gärna en{" "}
            <a href="#export" className="font-medium text-brand-700 hover:underline">
              export
            </a>{" "}
            innan du raderar.
          </p>
        </div>
        <DeleteAccountDialog email={email} />
      </div>
    </SettingsSection>
  );
}
