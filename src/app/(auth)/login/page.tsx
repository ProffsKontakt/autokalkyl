import { LoginForm } from './login-form'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Logga in - Kalkyla.se',
  description: 'Logga in till ditt Kalkyla-konto',
}

export default function LoginPage() {
  return (
    <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
      {/* Header with gradient accent */}
      <div className="relative px-8 pt-8 pb-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Kalkyla.se
          </h1>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
          Logga in för att fortsätta
        </p>
      </div>

      {/* Form section */}
      <div className="px-8 pb-8">
        <LoginForm />
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/50 dark:border-slate-700/30">
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Skyddad av industri-standard kryptering
        </p>
      </div>
    </div>
  )
}
