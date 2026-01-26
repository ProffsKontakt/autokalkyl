'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    question: 'Vad kostar solceller 2026?',
    answer: 'Priset för en komplett solcellsanläggning varierar beroende på storlek och kvalitet, men ligger oftast mellan 100 000 - 250 000 kr för en villa. Med grön teknik-avdraget på 50% blir din kostnad betydligt lägre. Använd vår kalkyl för att få ett exakt prisförslag baserat på dina förutsättningar.',
  },
  {
    question: 'Lönar sig batterilager?',
    answer: 'Ja, med dagens elpriser och effekttariffer kan ett batterilager ge en återbetalningstid på 5-8 år. Batteriet optimerar mot spotpriser (laddar när elen är billig, urladdas när den är dyr) och minskar effekttoppar som påverkar din elnätsavgift. Dessutom får du backup vid strömavbrott.',
  },
  {
    question: 'Hur lång är återbetalningstiden?',
    answer: 'Återbetalningstiden beror på din elförbrukning, elområde och anläggningens storlek. Generellt ser vi 6-10 år för solceller och 5-8 år för batterilager. Kombinerar du båda kan du nå lönsamhet snabbare tack vare synergier. Vår kalkyl ger dig en exakt beräkning baserat på dina siffror.',
  },
  {
    question: 'Vad är grön teknik-avdraget?',
    answer: 'Grön teknik-avdraget (även kallat ROT-avdrag för grön teknik) ger dig 50% skattereduktion på arbetskostnaden för installation av solceller och batterier. Avdraget görs direkt på fakturan, så du behöver inte ligga ute med pengarna. Max 50 000 kr per person och år.',
  },
  {
    question: 'Hur lång tid tar installationen?',
    answer: 'En typisk solcellsinstallation tar 1-2 dagar för en villa. Batterilager installeras ofta på en halv till en hel dag. Från beställning till installation räknar du med 2-6 veckor beroende på leverantör och säsong.',
  },
  {
    question: 'Behöver jag bygglov?',
    answer: 'I de flesta fall behövs inget bygglov för solceller på en villa, så länge panelerna följer takets form och inte sticker ut mer än 60 cm. För byggnader inom detaljplanerat område eller kulturhistoriskt värdefulla byggnader kan det finnas undantag. Kontrollera alltid med din kommun.',
  },
  {
    question: 'Hur fungerar Kalkyla.se?',
    answer: 'Kalkyla.se matchar dig med kvalitetsgranskade solcells- och batteriföretag i ditt område. Du svarar på några enkla frågor om din bostad och elförbrukning, får en direkt kalkyl på besparingen, och sedan kontaktar upp till 6 företag dig med offerter. Tjänsten är helt gratis och utan bindning.',
  },
  {
    question: 'Vilka företag är anslutna?',
    answer: 'Vi samarbetar endast med etablerade och kvalitetsgranskade företag som har dokumenterad erfarenhet av solcells- och batteriinstallationer. Alla företag är certifierade och följer branschens riktlinjer. Vi kontrollerar regelbundet kundnöjdhet och kvalitet.',
  },
]

function FAQItem({ question, answer, isOpen, onClick }: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <div className="border-b border-gray-200 dark:border-slate-700 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white pr-8">
          {question}
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-600 dark:text-gray-400">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            Vanliga frågor
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
          >
            Svar på det du undrar över
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-50 dark:bg-slate-900 rounded-2xl px-6 sm:px-8"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
