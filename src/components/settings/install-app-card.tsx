import type { ReactNode } from "react";
import { Download, EllipsisVertical, Share, Smartphone, SquarePlus, type LucideIcon } from "lucide-react";
import { brand } from "@/lib/brand";
import { SettingsSection } from "./settings-section";

function Step({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-ink-200" aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm leading-snug text-ink-600">{children}</span>
    </li>
  );
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-ink-900">{children}</strong>;
}

export function InstallAppCard() {
  return (
    <SettingsSection
      id="installera"
      icon={Smartphone}
      title="Installera som app"
      description={`Lägg ${brand.name} på hemskärmen så öppnas den som en vanlig app – utan App Store eller Google Play.`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-ink-50 p-4">
          <h3 className="font-semibold text-ink-900">iPhone och iPad</h3>
          <p className="text-xs text-ink-500">I Safari</p>
          <ol className="mt-3 space-y-2.5">
            <Step icon={Share}>
              Öppna <Strong>{brand.host}</Strong> i Safari och tryck på <Strong>Dela</Strong>-knappen (rutan med pilen).
            </Step>
            <Step icon={SquarePlus}>
              Välj <Strong>Lägg till på hemskärmen</Strong> och tryck på <Strong>Lägg till</Strong>.
            </Step>
          </ol>
        </div>
        <div className="rounded-xl bg-ink-50 p-4">
          <h3 className="font-semibold text-ink-900">Android</h3>
          <p className="text-xs text-ink-500">I Chrome</p>
          <ol className="mt-3 space-y-2.5">
            <Step icon={EllipsisVertical}>
              Öppna <Strong>{brand.host}</Strong> i Chrome och tryck på menyn (tre prickar) uppe till höger.
            </Step>
            <Step icon={Download}>
              Välj <Strong>Installera app</Strong> (eller <Strong>Lägg till på startskärmen</Strong>).
            </Step>
          </ol>
        </div>
      </div>
      <p className="mt-4 text-sm text-ink-500">Sedan hittar du {brand.name} bland dina andra appar, med egen ikon och utan adressfält. Du är fortfarande inloggad.</p>
    </SettingsSection>
  );
}
