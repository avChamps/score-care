import { AiShowcase, CategoryCards, CreditJourneyBand, FaqSection, FeaturesGrid, PricingCards, Testimonials, TrustBadges } from "@/components/sections/shared";
import { HomeHero } from "@/components/sections/hero";
import { NativeStartRedirect } from "@/components/native-start-redirect";

export default function Home() {
  return (
    <>
      <NativeStartRedirect />
      <HomeHero />
      <TrustBadges />
      <CategoryCards />
      <FeaturesGrid />
      <CreditJourneyBand />
      <AiShowcase />
      <PricingCards />
      <Testimonials />
      <FaqSection />
    </>
  );
}
