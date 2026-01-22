import { Zap, MessageCircle } from 'lucide-react'

interface PublicFooterProps {
  closerName: string
  primaryColor: string
}

export function PublicFooter({ closerName, primaryColor }: PublicFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/50 dark:border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <MessageCircle className="w-4 h-4" style={{ color: primaryColor }} />
            <span>
              Fragor? Kontakta{' '}
              <span className="font-semibold" style={{ color: primaryColor }}>{closerName}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Zap className="w-3.5 h-3.5" />
            <span>Powered by</span>
            <a
              href="https://kalkyla.se"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline transition-colors"
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
