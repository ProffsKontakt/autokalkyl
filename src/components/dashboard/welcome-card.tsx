import Link from "next/link";
import { Camera, ChevronRight, Mail, MessageCircleQuestion, X, type LucideIcon } from "lucide-react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface QuickAction {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
  { href: "/app/skanna", title: "Skanna ett kvitto", description: "Fota kvittot med mobilen – vi läser av butik, belopp och garanti.", icon: Camera },
  { href: "/app/installningar#kvittoadress", title: "Maila in kvitton", description: "Vidarebefordra digitala kvitton till din egen kvittoadress.", icon: Mail },
  { href: "/app/chatt", title: "Fråga AI", description: "Hitta rätt kvitto, kolla garantin eller få hjälp när något krånglar.", icon: MessageCircleQuestion },
];

/** Friendly onboarding card shown after registration (`/app?welcome=1`). */
export function WelcomeCard({ name, className }: { name: string; className?: string }) {
  return (
    <section
      className={cn("relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-card sm:p-6", className)}
      aria-labelledby="welcome-heading"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-100/70 blur-2xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Kom igång</p>
          <h2 id="welcome-heading" className="mt-1 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
            Välkommen till {brand.name}, {name}!
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-600">
            Ditt konto är klart. Här är tre enkla sätt att lägga in ditt första kvitto – det tar bara några sekunder.
          </p>
        </div>
        <Link href="/app" className="-mr-2 -mt-2 rounded-lg p-2 text-ink-400 transition-colors hover:bg-white hover:text-ink-900" aria-label="Stäng välkomstrutan" scroll={false}>
          <X className="h-5 w-5" aria-hidden />
        </Link>
      </div>

      <ol className="relative mt-5 grid gap-3 sm:grid-cols-3">
        {ACTIONS.map((action, index) => (
          <li key={action.href} className="animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
            <Link
              href={action.href}
              className="group flex h-full items-start gap-3 rounded-xl border border-ink-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                <action.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold text-ink-900">
                  {action.title}
                  <ChevronRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-500">{action.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
