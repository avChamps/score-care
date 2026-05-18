import type { Metadata } from "next";
import { Award, Building2, Eye, Rocket, ShieldCheck, Users } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { ImageFeature, StatsBand } from "@/components/sections/shared";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet SCORECARE, a premium credit intelligence company helping India build lender-ready credit.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About SCORECARE"
        title="We are building the command center for credit confidence."
        body="SCORECARE brings AI, bureau literacy, and expert repair workflows into one secure platform for modern consumers and growing businesses."
        primary="Explore pricing"
        href="/pricing"
      >
        <Card>
          <StatsBand />
        </Card>
      </PageHero>
      <ImageFeature
        eyebrow="Mission and vision"
        title="Make credit access transparent, measurable, and repairable."
        body="Our mission is to help people understand what lenders see and act before opportunity arrives. Our vision is a financial ecosystem where every profile can be improved with clear data and trusted guidance."
        image="mission-credit-visual"
      />
      <Section>
        <SectionHeader eyebrow="Why choose us" title="A premium fintech stack with human judgment where it matters." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Security first", text: "Consent-first data handling, encrypted UX patterns, and audit-friendly workflows." },
            { icon: Rocket, title: "Actionable speed", text: "Reports translate into high-impact next steps without financial jargon." },
            { icon: Award, title: "Repair expertise", text: "Specialist-backed paths for disputes, documentation, and bureau follow-through." },
          ].map((item) => (
            <Card key={item.title}>
              <item.icon className="size-8 text-cyan-500" />
              <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.text}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section className="bg-slate-950 text-white">
        <SectionHeader eyebrow="Leadership" title="Built by credit, risk, and product operators." body="A cross-functional leadership bench focused on financial clarity, responsible automation, and trust." />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { name: "Anika Rao", role: "CEO, credit infrastructure", Icon: Building2 },
            { name: "Kabir Sethi", role: "CTO, secure AI systems", Icon: Eye },
            { name: "Mira Shah", role: "Head of customer success", Icon: Users },
          ].map(({ name, role, Icon }) => (
            <Card key={name} className="border-white/10 bg-white/[0.06] text-white">
              <Icon className="size-8 text-cyan-300" />
              <h3 className="mt-5 text-xl font-bold">{name}</h3>
              <p className="mt-2 text-sm text-slate-300">{role}</p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
