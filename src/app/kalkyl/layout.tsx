import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Få din batterikalkyl | Kalkyla.se',
  description: 'Svara på några enkla frågor och få en gratis kalkyl på hur mycket du kan spara med solceller eller batterilager.',
}

export default function KalkylLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {children}
    </div>
  )
}
