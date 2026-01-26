import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 dark:bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="text-2xl font-bold">
              Kalkyla.se
            </Link>
            <p className="mt-4 text-gray-400 max-w-md">
              Jämför offerter på solceller och batterilager. Få en gratis kalkyl och bli kontaktad av kvalitetsgranskade företag i ditt område.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Tjänster</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/kalkyl?type=solar" className="hover:text-white transition-colors">
                  Solcellskalkyl
                </Link>
              </li>
              <li>
                <Link href="/kalkyl?type=battery" className="hover:text-white transition-colors">
                  Batterikalkyl
                </Link>
              </li>
              <li>
                <Link href="/kalkyl" className="hover:text-white transition-colors">
                  Komplett kalkyl
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  För företag
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Information</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/om-oss" className="hover:text-white transition-colors">
                  Om oss
                </Link>
              </li>
              <li>
                <Link href="/integritetspolicy" className="hover:text-white transition-colors">
                  Integritetspolicy
                </Link>
              </li>
              <li>
                <Link href="/villkor" className="hover:text-white transition-colors">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="hover:text-white transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {currentYear} Kalkyla.se. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Powered by</span>
            <span className="font-medium text-white">ProffsKontakt</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
