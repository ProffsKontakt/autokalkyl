'use client'

import { Battery, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/components/theme/theme-provider'

interface PublicHeaderProps {
  orgName: string
  logoUrl: string | null
  primaryColor: string
}

export function PublicHeader({ orgName, logoUrl, primaryColor }: PublicHeaderProps) {
  const [logoError, setLogoError] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
      <div
        className="h-1 absolute top-0 left-0 right-0"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }}
      />
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl && !logoError ? (
            // Use regular img tag for external URLs - Next.js Image requires domain whitelist
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${orgName} logo`}
              className="h-10 w-auto max-w-[150px] object-contain"
              onError={() => setLogoError(true)}
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
        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={resolvedTheme === 'dark' ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-slate-400 hover:text-yellow-500 transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-slate-500 hover:text-slate-700 transition-colors" />
            )}
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Battery className="w-4 h-4" style={{ color: primaryColor }} />
            <span>Batterikalkyl</span>
          </div>
        </div>
      </div>
    </header>
  )
}
