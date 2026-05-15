import Image from "next/image";
import { ArrowRight, CheckCircle2, UploadCloud } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { comparisonRows, faqs, features, insights, pricingPlans, securityBadges, stats, testimonials } from "@/lib/site";

export function TrustBadges() {
  return (
    <Section className="py-10 lg:py-12">
      <div className="grid gap-4 rounded-[2rem] border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-4">
        {securityBadges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <badge.icon className="size-5 text-cyan-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{badge.label}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function StatsBand() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <p className="text-3xl font-black text-slate-950 dark:text-white">{stat.value}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}

export function FeaturesGrid() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Capabilities"
        title="Everything your credit journey needs in one premium workspace."
        body="SCORECARE combines monitoring, analysis, report generation, and expert workflows without making finance feel heavy."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.04}>
            <Card className="group h-full transition duration-300 hover:-translate-y-1 hover:border-cyan-300/70">
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
                <feature.icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{feature.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function AiShowcase() {
  return (
    <Section className="overflow-hidden bg-slate-950 text-white">
      <div className="absolute left-0 top-0 size-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">AI Analysis</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">A credit analyst that reads between every line.</h2>
          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Upload a credit report and SCORECARE surfaces score drains, dispute-ready items, utilization risks, and a prioritized improvement path.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/ai-analysis">Analyze a report <ArrowRight className="size-4" /></Button>
            <Button href="/report" variant="secondary">View report plans</Button>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <Card className="border-white/10 bg-white/[0.07] text-white">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-200">SCORECARE AI</p>
                <h3 className="text-2xl font-bold">Insight Console</h3>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                <UploadCloud className="size-6" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <item.icon className="size-5 text-cyan-300" />
                  <p className="mt-4 text-sm text-slate-300">{item.title}</p>
                  <p className="text-3xl font-black">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">
              Recommendation: reduce revolving utilization below 25%, dispute two duplicate inquiries, and keep oldest account active.
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

export function PricingCards({ showToggle = false }: { showToggle?: boolean }) {
  return (
    <Section>
      <SectionHeader
        eyebrow="Plans"
        title="Premium credit care for every stage."
        body="Start with monitoring, upgrade into AI intelligence, or bring in expert repair support when the stakes are high."
      />
      {showToggle ? (
        <div className="mx-auto mb-8 flex w-full max-w-sm rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/10 sm:w-fit sm:max-w-none">
          <span className="flex-1 rounded-full bg-slate-950 px-4 py-2 text-center text-xs font-bold text-white dark:bg-white dark:text-slate-950 sm:flex-none sm:px-5 sm:text-sm">Monthly</span>
          <span className="flex-1 px-4 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-300 sm:flex-none sm:px-5 sm:text-sm">Yearly - save 20%</span>
        </div>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Card key={plan.name} className={plan.highlight ? "relative border-cyan-300 bg-slate-950 text-white" : ""}>
            {plan.highlight ? (
              <span className="mb-4 inline-flex rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950 sm:absolute sm:right-5 sm:top-5 sm:mb-0">Most popular</span>
            ) : null}
            <h3 className="text-2xl font-black">{plan.name}</h3>
            <p className={plan.highlight ? "mt-2 text-slate-300" : "mt-2 text-slate-600 dark:text-slate-300"}>{plan.description}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-black sm:text-5xl">{showToggle ? plan.yearly : plan.price}</span>
              <span className={plan.highlight ? "pb-2 text-slate-300" : "pb-2 text-slate-500"}>{showToggle ? "/year" : "/month"}</span>
            </div>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <p key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-cyan-400" />
                  {feature}
                </p>
              ))}
            </div>
            <Button href="/signup" className="mt-7 w-full" variant={plan.highlight ? "secondary" : "primary"}>
              Get started
            </Button>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function Testimonials() {
  return (
    <Section>
      <SectionHeader eyebrow="Customers" title="Built for people who treat credit like an asset." />
      <div className="grid gap-5 lg:grid-cols-3">
        {testimonials.map((item) => (
          <Card key={item.name}>
            <p className="text-base leading-7 text-slate-700 dark:text-slate-200 sm:text-lg sm:leading-8">&quot;{item.quote}&quot;</p>
            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
              <p className="font-bold text-slate-950 dark:text-white">{item.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function FaqSection() {
  return (
    <Section>
      <SectionHeader eyebrow="FAQ" title="Clear answers before you begin." />
      <Accordion items={faqs} />
    </Section>
  );
}

export function ImageFeature({
  eyebrow,
  title,
  body,
  image,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  reverse?: boolean;
}) {
  return (
    <Section>
      <div className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <Reveal>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-cyan-500">{eyebrow}</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">{title}</h2>
          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">{body}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-slate-200 shadow-2xl dark:border-white/10">
            <Image src={image} alt={title} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/65 via-blue-950/20 to-cyan-400/20" />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

export function ComparisonTable() {
  return (
    <Section>
      <SectionHeader eyebrow="Compare" title="Feature depth that scales with your ambition." />
      <div className="responsive-table overflow-x-auto rounded-[1.35rem] border border-slate-200 bg-white/80 shadow-xl dark:border-white/10 dark:bg-white/[0.06] sm:rounded-[1.75rem]">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-slate-950 p-4 text-sm font-bold text-white">
            <span>Feature</span>
            <span>Essential</span>
            <span>Pro</span>
            <span>Elite</span>
          </div>
          {comparisonRows.map((row) => (
            <div key={row[0]} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 border-t border-slate-200 p-4 text-sm dark:border-white/10">
              {row.map((cell) => (
                <span key={cell} className="text-slate-700 dark:text-slate-200">{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
