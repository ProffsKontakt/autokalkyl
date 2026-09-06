"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#sa-funkar-det", label: "Så funkar det" },
  { href: "/#garantier", label: "Garantier & rättigheter" },
  { href: "/#sakerhet", label: "Säkerhet" },
  { href: "/foretag", label: "För företag" },
];

export function SiteHeader({ loggedIn = false }: { loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Huvudmeny">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {loggedIn ? (
            <ButtonLink href="/app" size="sm">
              Öppna appen
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/logga-in" variant="ghost" size="sm">
                Logga in
              </ButtonLink>
              <ButtonLink href="/registrera" size="sm">
                Kom igång gratis
              </ButtonLink>
            </>
          )}
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Stäng meny" : "Öppna meny"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      <div id="mobile-menu" className={cn("border-t border-ink-200/70 bg-white md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3" aria-label="Mobilmeny">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-ink-50">
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-3">
            {loggedIn ? (
              <ButtonLink href="/app">Öppna appen</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/registrera">Kom igång gratis</ButtonLink>
                <ButtonLink href="/logga-in" variant="outline">
                  Logga in
                </ButtonLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
