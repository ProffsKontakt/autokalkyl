import Link from "next/link";
import { ArrowRight, Forward, Lightbulb, Mail, Paperclip, Send, Sparkles, type LucideIcon } from "lucide-react";
import { brand } from "@/lib/brand";
import { formatDateTime } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui";
import { SettingsSection } from "./settings-section";
import { CopyField } from "./copy-button";
import { AnchorButton } from "./anchor-button";

export type InboundEmailStatus = "ACCEPTED" | "REJECTED" | "FAILED";

export interface RecentInboundEmail {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string;
  subject: string | null;
  receiptId: string | null;
  createdAt: Date;
}

const STATUS: Record<InboundEmailStatus, { label: string; tone: BadgeTone }> = {
  ACCEPTED: { label: "Mottaget", tone: "success" },
  REJECTED: { label: "Avvisat", tone: "warning" },
  FAILED: { label: "Misslyckades", tone: "danger" },
};

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Forward,
    title: "Vidarebefordra",
    text: "Skicka orderbekräftelser och e-kvitton från butiken vidare till adressen – precis som de är.",
  },
  {
    icon: Paperclip,
    title: "Eller maila foton och PDF:er",
    text: "Bifoga bilder (JPG, PNG) eller PDF-kvitton. Flera bilagor i samma mail går bra.",
  },
  {
    icon: Sparkles,
    title: "Läses av automatiskt",
    text: "Både bilagorna och mailets innehåll tolkas: butik, datum, belopp, artiklar och garanti sparas på ditt konto.",
  },
];

export function InboundAddressCard({ address, recent }: { address: string; recent: RecentInboundEmail[] }) {
  const mailto = `mailto:${address}?subject=${encodeURIComponent(`Testkvitto till ${brand.name}`)}&body=${encodeURIComponent(
    "Hej! Det här är ett testmail till min kvittoadress. Bifoga gärna en bild på ett kvitto.",
  )}`;

  return (
    <SettingsSection
      id="kvittoadress"
      icon={Mail}
      title="Din kvittoadress"
      description={`Din egen e-postadress hos ${brand.name}. Allt som skickas hit hamnar bland dina kvitton.`}
    >
      <div className="space-y-6">
        <CopyField id="inbound-address" label="Din kvittoadress" value={address} message="Kopierad" />

        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.title} className="flex gap-3 sm:flex-col">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
                <step.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-ink-900">{step.title}</p>
                <p className="mt-0.5 text-sm leading-snug text-ink-500">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">Tips:</span> skapa en regel i din mail som automatiskt vidarebefordrar kvitton hit – till exempel allt från{" "}
            <span className="font-mono">noreply@…</span> eller mail vars ämne innehåller ”kvitto” eller ”orderbekräftelse”. Då behöver du inte göra
            något alls.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AnchorButton href={mailto} variant="outline" className="w-full sm:w-auto">
            <Send className="h-4 w-4" aria-hidden />
            Skicka ett testmail
          </AnchorButton>
          <p className="text-sm text-ink-500">Öppnar ditt mailprogram med adressen ifylld. Bifoga en bild på ett kvitto så dyker det upp här inom någon minut.</p>
        </div>

        {recent.length > 0 ? <RecentInboundList recent={recent} /> : null}
      </div>
    </SettingsSection>
  );
}

function RecentInboundList({ recent }: { recent: RecentInboundEmail[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">Senast mottaget</h3>
      <ul className="mt-2 divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200/80">
        {recent.map((mail) => {
          const status = STATUS[mail.status];
          const subject = mail.subject?.trim() || "(inget ämne)";
          const body = (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{subject}</p>
                <p className="truncate text-xs text-ink-500">Från {mail.fromAddress}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={status.tone}>{status.label}</Badge>
                <time dateTime={mail.createdAt.toISOString()} className="text-xs text-ink-500">
                  {formatDateTime(mail.createdAt)}
                </time>
              </div>
            </>
          );
          return (
            <li key={mail.id}>
              {mail.receiptId ? (
                <Link
                  href={`/app/kvitton/${mail.receiptId}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50"
                  aria-label={`Öppna kvittot från mailet ”${subject}”`}
                >
                  {body}
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
