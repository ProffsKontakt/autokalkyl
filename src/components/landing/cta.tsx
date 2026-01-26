'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white"
        >
          Redo att sänka dina elkostnader?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto"
        >
          Få en gratis kalkyl på hur mycket du kan spara med solceller eller batterilager. Det tar bara 2 minuter.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <Link
            href="/kalkyl"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-blue-600 bg-white hover:bg-blue-50 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            Starta din kalkyl nu
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
