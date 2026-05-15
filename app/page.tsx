import { AiShowcase, FaqSection, FeaturesGrid, PricingCards, Testimonials, TrustBadges } from "@/components/sections/shared";
import { HomeHero } from "@/components/sections/hero";

export default function Home() {
  return (
    <>
      <HomeHero />
      <TrustBadges />
      <FeaturesGrid />
      <AiShowcase />
      <PricingCards />
      <Testimonials />
      <FaqSection />
    </>
  );
}
