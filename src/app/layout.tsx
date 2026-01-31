import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MinimalProviders } from "./providers-minimal";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kalkyla.se - Batterikalkyl & Solcellskalkyl",
  description: "Jämför offerter på solceller och batterilager. Få gratis kalkyl och bli kontaktad av upp till 6 företag i ditt område. Beräkna ROI och besparingar.",
  keywords: ["batterikalkyl", "solcellskalkyl", "batteri ROI", "solceller pris", "batterilagring kostnad", "grön teknik avdrag"],
  openGraph: {
    title: "Kalkyla.se - Jämför offerter på solceller & batterier",
    description: "Få gratis kalkyl och bli kontaktad av upp till 6 företag i ditt område. Beräkna besparingar och återbetalningstid.",
    type: "website",
    locale: "sv_SE",
    siteName: "Kalkyla.se",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('kalkyla-theme');
                  var resolved = theme;
                  if (!theme || theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(resolved);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
      >
        <MinimalProviders>{children}</MinimalProviders>
        <Toaster richColors closeButton position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}
