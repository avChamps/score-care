import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, Headphones, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { ImageFeature } from "@/components/sections/shared";
import { repairTimeline } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "CIBIL Repair Services",
  description: "Premium CIBIL repair plans, expert consultations, and dispute support from SCORECARE.",
};

export default function CibilRepairPage() {
  return (
    <>
      <PageHero eyebrow="CIBIL repair" title="Repair credit issues with expert-backed precision." body="From inaccurate accounts to duplicate inquiries, SCORECARE structures the documentation and follow-through needed for a cleaner bureau profile." primary="Book consultation" href="#consultation">
        <Card><Headphones className="size-10 text-cyan-500" /><p className="mt-5 text-4xl font-black">4-step</p><p className="text-slate-600 dark:text-slate-300">guided repair workflow</p></Card>
      </PageHero>
      <Section>
        <SectionHeader eyebrow="Repair plans" title="Specialist support for serious credit recovery." />
        <div className="grid gap-5 md:grid-cols-3">
          {["Audit Sprint", "Dispute Pro", "Elite Recovery"].map((plan, index) => (
            <Card key={plan}>
              <ShieldCheck className="size-8 text-cyan-500" />
              <h3 className="mt-4 text-xl font-bold">{plan}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{index + 2} bureau workflows, expert review, and progress tracking.</p>
              <Button className="mt-6 w-full" variant={index === 1 ? "primary" : "secondary"}>Select plan</Button>
            </Card>
          ))}
        </div>
      </Section>
      <Section id="consultation" className="bg-slate-950 text-white">
        <SectionHeader eyebrow="Process" title="A clear path from audit to resolution." />
        <div className="grid gap-4 md:grid-cols-4">
          {repairTimeline.map((step, index) => (
            <Card key={step} className="border-white/10 bg-white/[0.06] text-white">
              <span className="grid size-10 place-items-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">{index + 1}</span>
              <p className="mt-5 text-sm leading-7 text-slate-200">{step}</p>
            </Card>
          ))}
        </div>
      </Section>
      <ImageFeature eyebrow="Success stories" title="Credit recovery that feels organized, not overwhelming." body="Track every dispute, document, and next step through a premium support experience built for clarity." image="score-repair-visual" />
      <Section>
        <Card className="flex flex-col items-start justify-between gap-6 bg-gradient-to-br from-blue-600 to-cyan-500 text-white md:flex-row md:items-center">
          <div><CalendarCheck className="size-10" /><h2 className="mt-4 text-3xl font-black">Book a premium repair consultation.</h2><p className="mt-2 text-blue-50">Get a guided review with a SCORECARE credit specialist.</p></div>
          <Button href="/contact" variant="secondary"><CheckCircle2 className="size-4" /> Talk to support</Button>
        </Card>
      </Section>
    </>
  );
}
