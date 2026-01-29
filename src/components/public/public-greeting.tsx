import { Sparkles } from 'lucide-react'

interface PublicGreetingProps {
  customerName: string
  closerName: string
  customGreeting: string | null
}

const DEFAULT_GREETING = `Hej {namn}, här är din batterikalkyl som du och {closer} har pratat om. Nedan ser du hur mycket du kan spara med ett batterisystem.`

export function PublicGreeting({
  customerName,
  closerName,
  customGreeting,
}: PublicGreetingProps) {
  // Use custom greeting or default
  const template = customGreeting || DEFAULT_GREETING

  // Replace placeholders
  const greeting = template
    .replace(/\{namn\}/gi, customerName)
    .replace(/\{closer\}/gi, closerName)

  return (
    <section className="relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-amber-400/10 to-orange-400/10 dark:from-amber-500/20 dark:to-orange-500/20">
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
          {greeting}
        </p>
      </div>
    </section>
  )
}
