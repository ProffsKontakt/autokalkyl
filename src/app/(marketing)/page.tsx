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
import { AccountDeletedNotice } from "@/components/marketing/account-deleted-notice";

export const metadata: Metadata = {
  title: brand.tagline,
  description: brand.description,
  alternates: { canonical: "/" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const deleted = params.deleted === "1";

  return (
    <>
      {deleted ? <AccountDeletedNotice /> : null}
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
