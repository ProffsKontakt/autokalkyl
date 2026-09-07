"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, FileText, Home, LogOut, MessageCircleQuestion, Settings, ShieldCheck, Trash2 } from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

const nav = [
  { href: "/app", label: "Översikt", icon: Home, exact: true },
  { href: "/app/kvitton", label: "Kvitton", icon: FileText },
  { href: "/app/skanna", label: "Skanna", icon: Camera, primary: true },
  { href: "/app/garantier", label: "Garantier", icon: ShieldCheck },
  { href: "/app/chatt", label: "Fråga AI", icon: MessageCircleQuestion },
];

const secondary = [
  { href: "/app/papperskorg", label: "Papperskorg", icon: Trash2 },
  { href: "/app/installningar", label: "Inställningar", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-ink-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200/70 bg-white lg:flex lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex h-16 items-center px-5">
          <Logo href="/app" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Appmeny">
          {nav.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                  item.primary && !active && "text-brand-700",
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
          <div className="my-3 border-t border-ink-100" />
          {secondary.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 p-4">
          <div className="truncate text-sm font-semibold text-ink-900">{user.name}</div>
          <div className="truncate text-xs text-ink-500">{user.email}</div>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900">
              <LogOut className="h-4 w-4" aria-hidden /> Logga ut
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-200/70 bg-white/90 px-4 backdrop-blur lg:hidden">
          <Link href="/app" className="flex items-center gap-2 font-bold text-ink-900" aria-label="Översikt">
            <LogoMark size={26} />
          </Link>
          <Link href="/app/installningar" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800" aria-label="Inställningar">
            {user.name.trim().charAt(0).toUpperCase() || "K"}
          </Link>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Snabbmeny">
          <ul className="grid grid-cols-5">
            {nav.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              if (item.primary) {
                return (
                  <li key={item.href} className="flex justify-center">
                    <Link href={item.href} className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-card ring-4 ring-white" aria-label={item.label}>
                      <item.icon className="h-6 w-6" aria-hidden />
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-brand-700" : "text-ink-500")}
                  >
                    <item.icon className="h-5 w-5" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
