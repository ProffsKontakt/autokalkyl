import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 text-center">
      <Logo />
      <p className="mt-10 text-sm font-semibold uppercase tracking-widest text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">Sidan hittades inte</h1>
      <p className="mt-2 max-w-md text-ink-500">Kvittot på den här sidan verkar ha försvunnit. Vi hjälper dig hitta rätt.</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/">Till startsidan</ButtonLink>
        <ButtonLink href="/app" variant="outline">Öppna appen</ButtonLink>
      </div>
      <Link href="/foretag" className="mt-8 text-sm text-ink-500 underline-offset-4 hover:underline">Letar du efter företagslösningen?</Link>
    </div>
  );
}
