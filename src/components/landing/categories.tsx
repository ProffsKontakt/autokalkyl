'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SunIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline'

const categories = [
  {
    icon: SunIcon,
    title: 'Solceller',
    description: 'Producera din egen el och sänk elkostnaden. Perfekt för villor med bra solläge.',
    benefits: ['Lägre elräkning', 'Miljövänligt', 'Ökar fastighetsvärdet'],
    href: '/kalkyl?type=solar',
    color: 'yellow',
  },
  {
    icon: BoltIcon,
    title: 'Batterilager',
    description: 'Lagra el när den är billig och använd när den är dyr. Maximera besparingarna.',
    benefits: ['Spotprisoptimering', 'Effekttariff-besparing', 'Backup vid strömavbrott'],
    href: '/kalkyl?type=battery',
    color: 'blue',
  },
  {
    icon: SparklesIcon,
    title: 'Solceller + Batteri',
    description: 'Kombinera solceller och batteri för maximal besparing och självförsörjning.',
    benefits: ['Högst besparing', 'Energioberoende', 'Komplett lösning'],
    href: '/kalkyl?type=both',
    color: 'emerald',
  },
]

export function Categories() {
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
            Vad är du intresserad av?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
          >
            Välj det som passar dig bäst – eller låt oss hjälpa dig att välja
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={category.href}
                className="block bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 h-full"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  category.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                  category.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <category.icon className="h-7 w-7" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {category.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {category.description}
                </p>

                <ul className="space-y-2">
                  {category.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
                  Beräkna besparing
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
