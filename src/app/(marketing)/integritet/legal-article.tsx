import type { ReactNode } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui";
import { brand } from "@/lib/brand";
import { cn, formatDate } from "@/lib/utils";

export type LegalSection = { id: string; label: string };

/**
 * Prose styling for legal documents. There is no typography plugin in the project,
 * so headings, lists and links inside the article are styled with descendant selectors.
 */
const proseClass = cn(
  "text-[15px] leading-relaxed text-ink-700 sm:text-base",
  "[&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink-900 sm:[&_h2]:text-2xl [&_h2:first-child]:mt-0",
  "[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink-900",
  "[&_p]:mt-4",
  "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
  "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
  "[&_strong]:font-semibold [&_strong]:text-ink-900",
  "[&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-brand-800",
);

/** A highlighted box for the plain-language summary at the top of a legal document. */
export function LegalSummary({ title = "Kort version", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-6">
      <h2 className="mt-0! text-base! font-semibold text-brand-900">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-ink-700 [&_p]:mt-2! [&_p:first-child]:mt-0!">{children}</div>
    </div>
  );
}

export function LegalArticle({
  eyebrow,
  title,
  lead,
  updated,
  sections,
  related,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  /** ISO date (YYYY-MM-DD) of the last revision. */
  updated: string;
  sections: LegalSection[];
  related: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="border-b border-ink-200/70 bg-paper">
        <Container className="max-w-3xl py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-600">{lead}</p>
          <p className="mt-5 text-sm text-ink-500">
            Senast uppdaterad <time dateTime={updated}>{formatDate(updated)}</time> · Gäller {brand.name} ({brand.host})
          </p>
        </Container>
      </div>

      <Container className="max-w-3xl py-10 sm:py-14">
        <nav aria-label="Innehåll" className="mb-10 rounded-2xl border border-ink-200/80 bg-ink-50 p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-900">Innehåll</h2>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-ink-600 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex gap-2 py-0.5 underline-offset-4 hover:text-brand-700 hover:underline">
                  <span className="tabular-nums text-ink-400">{index + 1}.</span>
                  <span>{section.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className={proseClass}>{children}</article>

        <aside className="mt-14 rounded-2xl border border-ink-200/80 bg-ink-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <div>
              <h2 className="font-semibold text-ink-900">Frågor?</h2>
              <p className="mt-1 text-sm text-ink-600">
                Hör av dig till{" "}
                <a href={`mailto:${brand.supportEmail}`} className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800">
                  {brand.supportEmail}
                </a>{" "}
                så svarar vi så snart vi kan.
              </p>
              <p className="mt-3 text-sm text-ink-600">
                Se även{" "}
                <Link href={related.href} className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800">
                  {related.label}
                </Link>
                .
              </p>
            </div>
          </div>
        </aside>
      </Container>
    </div>
  );
}
