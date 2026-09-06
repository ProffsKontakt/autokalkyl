import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { Hero } from "@/components/marketing/sections/hero";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { WarrantyAssistant } from "@/components/marketing/sections/warranty-assistant";
import { VideoSection } from "@/components/marketing/sections/video-section";
import { UseCases } from "@/components/marketing/sections/use-cases";
import { Security } from "@/components/marketing/sections/security";
import { BusinessTeaser } from "@/components/marketing/sections/business-teaser";
import { Faq } from "@/components/marketing/sections/faq";
import { FinalCta } from "@/components/marketing/sections/final-cta";

export const metadata: Metadata = {
  title: brand.tagline,
  description: brand.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <WarrantyAssistant />
      <VideoSection />
      <UseCases />
      <Security />
      <BusinessTeaser />
      <Faq />
      <FinalCta />
    </>
  );
}
