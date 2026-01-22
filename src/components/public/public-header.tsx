import Image from 'next/image'
import { Battery } from 'lucide-react'

interface PublicHeaderProps {
  orgName: string
  logoUrl: string | null
  primaryColor: string
}

export function PublicHeader({ orgName, logoUrl, primaryColor }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
      <div
        className="h-1 absolute top-0 left-0 right-0"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }}
      />
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${orgName} logo`}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {orgName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Battery className="w-4 h-4" style={{ color: primaryColor }} />
          <span>Batterikalkyl</span>
        </div>
      </div>
    </header>
  )
}
