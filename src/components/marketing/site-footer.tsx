import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-500">{brand.tagline} Trygg digital kvittohantering för privatpersoner – och snart för företag.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Tjänsten</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li><Link href="/#sa-funkar-det" className="hover:text-ink-900">Så funkar det</Link></li>
            <li><Link href="/#garantier" className="hover:text-ink-900">Garantier & rättigheter</Link></li>
            <li><Link href="/#sakerhet" className="hover:text-ink-900">Säkerhet & lagring</Link></li>
            <li><Link href="/foretag" className="hover:text-ink-900">För företag</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Konto & juridik</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li><Link href="/logga-in" className="hover:text-ink-900">Logga in</Link></li>
            <li><Link href="/registrera" className="hover:text-ink-900">Skapa konto</Link></li>
            <li><Link href="/integritet" className="hover:text-ink-900">Integritetspolicy</Link></li>
            <li><Link href="/villkor" className="hover:text-ink-900">Användarvillkor</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} {brand.name} · {brand.host}</span>
          <span>Kvitton sparas i 7 år enligt bokföringslagen · Servrar inom EU</span>
        </div>
      </div>
    </footer>
  );
}
