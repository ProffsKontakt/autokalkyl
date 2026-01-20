interface PublicFooterProps {
  closerName: string
  primaryColor: string
}

export function PublicFooter({ closerName, primaryColor }: PublicFooterProps) {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-700">
              Har du fragor? Kontakta{' '}
              <span className="font-medium">{closerName}</span>
            </p>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            Powered by{' '}
            <a
              href="https://kalkyla.se"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Kalkyla.se
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
