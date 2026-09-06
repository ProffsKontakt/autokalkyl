import Link from "next/link";
import { MessageCircleQuestion, Scale, ShieldAlert, ShieldCheck, ShieldX, Undo2 } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, type BadgeTone } from "@/components/ui";
import { daysLeftLabel } from "@/components/receipts/status-badge";
import { daysUntil, formatDate } from "@/lib/utils";
import { receiptHref, type CoverageStatusValue, type ReceiptDetail } from "./types";

const CHIP: Record<CoverageStatusValue, { label: string; tone: BadgeTone; icon: typeof ShieldCheck }> = {
  active: { label: "Aktiv", tone: "success", icon: ShieldCheck },
  expiring: { label: "Går ut snart", tone: "warning", icon: ShieldAlert },
  expired: { label: "Utgången", tone: "neutral", icon: ShieldX },
  unknown: { label: "Okänt", tone: "neutral", icon: ShieldX },
};

function Line({ icon: Icon, title, detail, muted = false }: { icon: typeof ShieldCheck; title: string; detail?: string; muted?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className={muted ? "mt-0.5 text-ink-300" : "mt-0.5 text-brand-600"}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className={muted ? "text-[15px] text-ink-500" : "text-[15px] font-medium text-ink-900"}>{title}</div>
        {detail ? <div className="text-sm text-ink-500">{detail}</div> : null}
      </div>
    </li>
  );
}

/** Warranty, statutory claim right and return window for a receipt. */
export function WarrantyPanel({ receipt }: { receipt: ReceiptDetail }) {
  const { coverage } = receipt;
  const chip = CHIP[coverage.status];
  const ChipIcon = chip.icon;
  const isBusiness = receipt.accountType === "BUSINESS";
  const legalYears = isBusiness ? 2 : 3;
  const returnDays = daysUntil(receipt.returnDeadline);

  const summary =
    coverage.status === "unknown"
      ? "Lägg in inköpsdatum så räknar vi ut hur länge du är skyddad."
      : `${coverage.kind === "warranty" ? "Garantin" : "Reklamationsrätten"} – ${daysLeftLabel({ daysLeft: coverage.daysLeft, until: coverage.until ? new Date(coverage.until) : null }).toLowerCase()}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Garanti och rättigheter</CardTitle>
          <Badge tone={chip.tone}>
            <ChipIcon className="h-3.5 w-3.5" aria-hidden />
            {chip.label}
          </Badge>
        </div>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="space-y-3">
          {receipt.warrantyMonths && receipt.warrantyExpiresAt ? (
            <Line icon={ShieldCheck} title={`Garanti: ${receipt.warrantyMonths} mån, till ${formatDate(receipt.warrantyExpiresAt)}`} detail={daysLeftLabel({ daysLeft: daysUntil(receipt.warrantyExpiresAt), until: new Date(receipt.warrantyExpiresAt) })} />
          ) : receipt.warrantyMonths ? (
            <Line icon={ShieldCheck} title={`Garanti: ${receipt.warrantyMonths} mån`} detail="Ange inköpsdatum för att se slutdatum." />
          ) : (
            <Line icon={ShieldCheck} title="Ingen garanti registrerad" detail="Står det en garantitid på kvittot? Lägg till den via Redigera." muted />
          )}
          {receipt.legalClaimDeadline ? (
            <Line icon={Scale} title={`Reklamationsrätt: ${legalYears} år, till ${formatDate(receipt.legalClaimDeadline)}`} detail={daysLeftLabel({ daysLeft: daysUntil(receipt.legalClaimDeadline), until: new Date(receipt.legalClaimDeadline) })} />
          ) : (
            <Line icon={Scale} title={`Reklamationsrätt: ${legalYears} år från köpet`} detail="Ange inköpsdatum för att se slutdatum." muted />
          )}
          {receipt.returnDeadline ? (
            <Line
              icon={Undo2}
              title={`Öppet köp till ${formatDate(receipt.returnDeadline)}`}
              detail={returnDays === null ? undefined : returnDays < 0 ? "Tiden för öppet köp har passerat." : returnDays === 0 ? "Sista dagen är idag." : `${returnDays} dagar kvar att ångra köpet.`}
              muted={returnDays !== null && returnDays < 0}
            />
          ) : null}
        </ul>

        {receipt.warrantyNotes ? (
          <div className="rounded-xl bg-ink-50 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-500">Garantivillkor från kvittot</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{receipt.warrantyNotes}</p>
          </div>
        ) : null}

        <p className="text-sm leading-relaxed text-ink-500">
          {isBusiness
            ? "Som företag har du två års reklamationsrätt enligt köplagen. En garanti är ett frivilligt löfte från säljaren eller tillverkaren och gäller utöver det."
            : "Du har alltid tre års reklamationsrätt enligt konsumentköplagen, oavsett garanti. Fel som visar sig inom två år antas ha funnits från början. En garanti är ett extra löfte från butiken eller tillverkaren."}{" "}
          Kvittot är ditt köpbevis – därför sparar vi det åt dig.
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
          <Link href="#fraga-ai" className="inline-flex items-center gap-1.5 text-brand-700 hover:underline">
            <MessageCircleQuestion className="h-4 w-4" aria-hidden /> Fråga AI om garantin
          </Link>
          <Link href={receiptHref(receipt.id, true)} className="text-ink-600 hover:text-ink-900 hover:underline">
            Ändra garantiuppgifter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
