import type { Metadata } from 'next'
import {
  Hero,
  HowItWorks,
  Benefits,
  TrustSignals,
  Categories,
  FAQ,
  CTA,
  Footer,
} from '@/components/landing'

export const metadata: Metadata = {
  title: 'Batterikalkyl & Solcellskalkyl | Jämför offerter - Kalkyla.se',
  description: 'Jämför offerter på solceller och batterilager. Få en gratis kalkyl och bli kontaktad av upp till 6 kvalitetsgranskade företag i ditt område. Beräkna ROI och besparingar.',
  keywords: ['batterikalkyl', 'solcellskalkyl', 'batteri ROI', 'solceller pris 2026', 'batterilagring kostnad', 'grön teknik avdrag', 'solceller villa', 'batterilager hemma'],
  openGraph: {
    title: 'Kalkyla.se - Jämför offerter på solceller & batterier',
    description: 'Få gratis kalkyl och bli kontaktad av upp till 6 företag. Beräkna besparingar och återbetalningstid för solceller och batterilager.',
    type: 'website',
    locale: 'sv_SE',
    siteName: 'Kalkyla.se',
    url: 'https://kalkyla.se',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kalkyla.se - Jämför offerter på solceller & batterier',
    description: 'Få gratis kalkyl och bli kontaktad av upp till 6 företag. Beräkna besparingar och återbetalningstid.',
  },
  alternates: {
    canonical: 'https://kalkyla.se',
  },
}

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kalkyla.se',
  url: 'https://kalkyla.se',
  description: 'Jämför offerter på solceller och batterilager. Få en gratis kalkyl och bli kontaktad av kvalitetsgranskade företag.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://kalkyla.se/kalkyl?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Vad kostar solceller 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Priset för en komplett solcellsanläggning varierar beroende på storlek och kvalitet, men ligger oftast mellan 100 000 - 250 000 kr för en villa. Med grön teknik-avdraget på 50% blir din kostnad betydligt lägre.',
      },
    },
    {
      '@type': 'Question',
      name: 'Lönar sig batterilager?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, med dagens elpriser och effekttariffer kan ett batterilager ge en återbetalningstid på 5-8 år. Batteriet optimerar mot spotpriser och minskar effekttoppar som påverkar din elnätsavgift.',
      },
    },
    {
      '@type': 'Question',
      name: 'Vad är grön teknik-avdraget?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Grön teknik-avdraget ger dig 50% skattereduktion på arbetskostnaden för installation av solceller och batterier. Avdraget görs direkt på fakturan. Max 50 000 kr per person och år.',
      },
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main>
        <Hero />
        <HowItWorks />
        <Categories />
        <Benefits />
        <TrustSignals />
        <FAQ />
        <CTA />
        <Footer />
      </main>
    </>
  )
}
