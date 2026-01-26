'use client'

import { motion } from 'framer-motion'
import {
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const benefits = [
  {
    icon: CurrencyDollarIcon,
    title: '100% gratis',
    description: 'Vår tjänst är helt kostnadsfri för dig som konsument. Inga dolda avgifter.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Kvalitetsgranskade företag',
    description: 'Alla företag i vårt nätverk är noggrant utvalda och kvalitetskontrollerade.',
  },
  {
    icon: ClockIcon,
    title: 'Spara tid',
    description: 'Slipp ringa runt till olika företag. Vi matchar dig med rätt leverantörer.',
  },
  {
    icon: BuildingOfficeIcon,
    title: 'Lokala experter',
    description: 'Få offerter från företag som är etablerade i ditt område.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Ingen bindning',
    description: 'Du väljer helt fritt om du vill gå vidare med någon av offertförfrågan.',
  },
  {
    icon: ChartBarIcon,
    title: 'Exakt kalkyl',
    description: 'Se direkt hur mycket du sparar baserat på din faktiska elförbrukning.',
  },
]

export function Benefits() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            Varför använda Kalkyla?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
          >
            Vi gör det enkelt att hitta rätt lösning för din energiförsörjning
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
