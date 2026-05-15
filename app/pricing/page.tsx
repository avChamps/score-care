import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { ComparisonTable, PricingCards, TrustBadges } from "@/components/sections/shared";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Compare SCORECARE credit monitoring, AI analysis, and CIBIL repair pricing plans.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Choose the credit operating system that fits your goal." body="Transparent plans for monitoring, premium AI analysis, and expert-assisted CIBIL repair." primary="Start free check" href="/credit-score">
        <Card><ShieldCheck className="size-10 text-cyan-500" /><p className="mt-5 text-2xl font-black">Secure by design</p><p className="mt-2 text-slate-600 dark:text-slate-300">Encryption, consent, and privacy controls included on every plan.</p></Card>
      </PageHero>
      <PricingCards showToggle />
      <ComparisonTable />
      <TrustBadges />
    </>
  );
}
