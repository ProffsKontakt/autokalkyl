'use client'

import { motion } from 'framer-motion'
import { ClipboardDocumentListIcon, CalculatorIcon, UserGroupIcon } from '@heroicons/react/24/outline'

const steps = [
  {
    icon: ClipboardDocumentListIcon,
    title: 'Beskriv ditt behov',
    description: 'Svara på några enkla frågor om din bostad och elförbrukning. Tar bara 2 minuter.',
    color: 'blue',
  },
  {
    icon: CalculatorIcon,
    title: 'Få din kalkyl',
    description: 'Se direkt hur mycket du kan spara med solceller eller batterilager. Beräkna ROI och återbetalningstid.',
    color: 'emerald',
  },
  {
    icon: UserGroupIcon,
    title: 'Bli kontaktad',
    description: 'Upp till 6 kvalitetsgranskade företag i ditt område kontaktar dig med offerter.',
    color: 'purple',
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            Så fungerar det
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
          >
            Tre enkla steg till din solcells- eller batterianläggning
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-slate-700 dark:to-slate-800" />
              )}

              <div className="relative bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 text-center">
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  step.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  step.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  <step.icon className="h-8 w-8" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
