import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} – Trygg digital kvittohantering`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  keywords: ["kvitton", "digitala kvitton", "kvittohantering", "garanti", "reklamationsrätt", "spara kvitton", "kvittoapp"],
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: brand.name,
    title: `${brand.name} – Alla dina kvitton. Alltid till hands.`,
    description: brand.description,
    images: [{ url: "/images/hero-kitchen.jpg", width: 1800, height: 1207, alt: `${brand.name}` }],
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1c6f61",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
