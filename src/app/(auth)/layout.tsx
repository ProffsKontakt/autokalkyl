import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-ink-500">
        <Link href="/integritet" className="hover:text-ink-900">Integritetspolicy</Link> · <Link href="/villkor" className="hover:text-ink-900">Villkor</Link>
      </footer>
    </div>
  );
}
