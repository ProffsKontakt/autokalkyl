const SECTIONS: { id: string; label: string }[] = [
  { id: "profil", label: "Profil" },
  { id: "inloggning", label: "Inloggning" },
  { id: "kvittoadress", label: "Kvittoadress" },
  { id: "export", label: "Export" },
  { id: "losenord", label: "Lösenord" },
  { id: "installera", label: "Installera som app" },
  { id: "farozon", label: "Radera konto" },
];

/** Horizontal chip row of in-page anchors – handy on a phone where the sections stack. */
export function SettingsNav() {
  return (
    <nav aria-label="Avsnitt på sidan" className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="inline-flex h-9 items-center rounded-full border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
