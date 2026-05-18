import { AiShowcase, CategoryCards, CreditJourneyBand, FaqSection, FeaturesGrid, PricingCards, Testimonials, TrustBadges } from "@/components/sections/shared";
import { HomeHero } from "@/components/sections/hero";

export default function Home() {
  return (
    <>
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
