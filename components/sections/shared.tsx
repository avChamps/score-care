import { ArrowRight, BadgeCheck, CheckCircle2, FileText, Gauge, Sparkles, UploadCloud } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { comparisonRows, faqs, features, insights, pricingPlans, securityBadges, stats, testimonials } from "@/lib/site";

export function TrustBadges() {
  return (
    <Section className="py-10 lg:py-12">
      <div className="grid gap-4 rounded-[2.5rem] border border-[#6f5948]/12 bg-[#fffdf7]/80 p-5 shadow-[0_18px_60px_rgba(92,62,37,0.08)] backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
        {securityBadges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-3 rounded-[1.5rem] bg-[#fff7e8] p-4">
            <badge.icon className="size-5 text-[#1f8a5b]" />
            <span className="text-sm font-bold text-[#6f5948]">{badge.label}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function CategoryCards() {
  const cards = [
    { title: "Score check", body: "Soft-check credit preview", Icon: Gauge, tone: "bg-[#8bd8b6]/34" },
    { title: "Reports", body: "Beautiful bureau summary", Icon: FileText, tone: "bg-[#f8d96b]/38" },
    { title: "AI insights", body: "Action plan in minutes", Icon: Sparkles, tone: "bg-[#ffb38a]/34" },
    { title: "Repair desk", body: "Dispute-ready guidance", Icon: BadgeCheck, tone: "bg-[#d7b7ff]/30" },
  ];

  return (
    <Section className="py-10 lg:py-14">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1f8a5b]">Explore SCORECARE</p>
          <h2 className="mt-2 max-w-3xl text-4xl font-black leading-none text-[#2d2119] sm:text-6xl">
            find your credit path today
          </h2>
        </div>
        <Button href="/pricing" variant="secondary">
          Explore all plans <ArrowRight className="size-4" />
        </Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ Icon, body, title, tone }) => (
          <Card key={title} className="group relative min-h-64 overflow-hidden p-6 transition duration-300 hover:-translate-y-2">
            <div className={`organic-scoop absolute -right-10 -top-8 size-36 ${tone}`} />
            <div className="relative grid size-16 place-items-center rounded-[1.5rem] bg-[#2d2119] text-[#fff7e8] transition group-hover:rotate-3">
              <Icon className="size-8" />
            </div>
            <h3 className="relative mt-12 text-3xl font-black leading-none text-[#2d2119]">{title}</h3>
            <p className="relative mt-3 text-sm font-bold text-[#6f5948]">{body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function CreditJourneyBand() {
  const steps = ["Consent", "Score", "Analyze", "Improve"];

  return (
    <Section className="bg-[#2d2119] text-[#fff7e8]">
      <div className="absolute inset-0 organic-rings opacity-20" />
      <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#8bd8b6]">Credit-to-confidence journey</p>
          <h2 className="mt-3 text-4xl font-black leading-none sm:text-6xl">crafted with care, backed by data</h2>
          <p className="mt-5 text-base leading-7 text-[#f7e7c6]">
            From secure score checks to repair-ready recommendations, each step is packaged like a premium product experience.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step} className="rounded-[2rem] border border-[#fff7e8]/12 bg-[#fff7e8]/8 p-5">
              <span className="grid size-11 place-items-center rounded-full bg-[#f8d96b] text-sm font-black text-[#2d2119]">{index + 1}</span>
              <h3 className="mt-5 text-2xl font-black">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-[#f7e7c6]">
                {index === 0 ? "Secure and consent-first onboarding." : index === 1 ? "CIBIL score and bureau snapshot." : index === 2 ? "AI report diagnosis and risk factors." : "Guided actions and repair workflows."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function StatsBand() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <p className="text-3xl font-black text-[#2d2119]">{stat.value}</p>
          <p className="mt-2 text-sm font-semibold text-[#6f5948]">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}

export function FeaturesGrid() {
  return (
    <Section className="organic-band">
      <div className="absolute left-0 top-14 h-32 w-1/4 rounded-r-[4rem] bg-[#ffb38a]/18" />
      <div className="absolute bottom-12 right-0 h-40 w-1/3 rounded-l-[5rem] bg-[#8bd8b6]/18" />
      <SectionHeader
        eyebrow="Capabilities"
        title="Everything your credit journey needs in one premium workspace."
        body="SCORECARE combines monitoring, analysis, report generation, and expert workflows without making finance feel heavy."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.04}>
            <Card className="group relative h-full min-h-72 overflow-hidden transition duration-300 hover:-translate-y-2 hover:border-[#1f8a5b]/35">
              <div className="organic-blob absolute -right-10 -top-10 size-32 bg-[#f8d96b]/24 transition group-hover:scale-110" />
              <div className="mb-8 grid size-14 place-items-center rounded-[1.4rem] bg-gradient-to-br from-[#1f8a5b] to-[#8bd8b6] text-[#2d2119] shadow-lg shadow-[#1f8a5b]/10 transition group-hover:scale-105">
                <feature.icon className="size-6" />
              </div>
              <h3 className="text-xl font-black text-[#2d2119]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#6f5948]">{feature.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function AiShowcase() {
  return (
    <Section className="overflow-hidden bg-[#fff7e8] text-[#2d2119]">
      <div className="absolute inset-0 organic-rings opacity-25" />
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-[#1f8a5b]">AI Analysis</p>
          <h2 className="text-3xl font-black leading-tight tracking-normal sm:text-5xl">A credit analyst that reads between every line.</h2>
          <p className="mt-5 text-base leading-7 text-[#6f5948] sm:text-lg sm:leading-8">
            Upload a credit report and SCORECARE surfaces score drains, dispute-ready items, utilization risks, and a prioritized improvement path.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/ai-analysis">Analyze a report <ArrowRight className="size-4" /></Button>
            <Button href="/report" variant="secondary">View report plans</Button>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <Card className="border-[#2d2119]/10 !bg-[#2d2119] text-[#fff7e8]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8bd8b6]">SCORECARE AI</p>
                <h3 className="text-2xl font-bold">Insight Console</h3>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-[#8bd8b6]/15 text-[#8bd8b6]">
                <UploadCloud className="size-6" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-[#fff7e8]/10 bg-[#fff7e8]/8 p-4">
                  <item.icon className="size-5 text-[#8bd8b6]" />
                  <p className="mt-4 text-sm text-[#f7e7c6]">{item.title}</p>
                  <p className="text-3xl font-black">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-[#8bd8b6]/20 bg-[#8bd8b6]/10 p-4 text-sm leading-6 text-[#fff7e8]">
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
    <Section className="organic-band">
      <SectionHeader
        eyebrow="Plans"
        title="Premium credit care for every stage."
        body="Start with monitoring, upgrade into AI intelligence, or bring in expert repair support when the stakes are high."
      />
      {showToggle ? (
        <div className="mx-auto mb-8 flex w-full max-w-sm rounded-full border border-[#6f5948]/15 bg-[#fffdf7] p-1 shadow-sm sm:w-fit sm:max-w-none">
          <span className="flex-1 rounded-full bg-[#2d2119] px-4 py-2 text-center text-xs font-black text-[#fff7e8] sm:flex-none sm:px-5 sm:text-sm">Monthly</span>
          <span className="flex-1 px-4 py-2 text-center text-xs font-black text-[#6f5948] sm:flex-none sm:px-5 sm:text-sm">Yearly - save 20%</span>
        </div>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Card key={plan.name} className={plan.highlight ? "relative min-h-[30rem] border-[#2d2119] !bg-[#2d2119] text-[#fff7e8]" : "min-h-[30rem]"}>
            {plan.highlight ? (
              <span className="mb-4 inline-flex rounded-full bg-[#f8d96b] px-3 py-1 text-xs font-black text-[#2d2119] sm:absolute sm:right-5 sm:top-5 sm:mb-0">Most popular</span>
            ) : null}
            <h3 className="text-2xl font-black">{plan.name}</h3>
            <p className={plan.highlight ? "mt-2 text-[#f7e7c6]" : "mt-2 text-[#6f5948]"}>{plan.description}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-black sm:text-5xl">{showToggle ? plan.yearly : plan.price}</span>
              <span className={plan.highlight ? "pb-2 text-[#f7e7c6]" : "pb-2 text-[#6f5948]"}>{showToggle ? "/year" : "/month"}</span>
            </div>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <p key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-[#8bd8b6]" />
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
    <Section className="bg-[#fff7e8]">
      <SectionHeader eyebrow="Customers" title="Built for people who treat credit like an asset." />
      <div className="grid gap-5 lg:grid-cols-3">
        {testimonials.map((item) => (
          <Card key={item.name} className="relative overflow-hidden">
            <div className="absolute right-5 top-5 size-12 rounded-full bg-[#ffb38a]/25" />
            <p className="text-base leading-7 text-[#6f5948] sm:text-lg sm:leading-8">&quot;{item.quote}&quot;</p>
            <div className="mt-6 border-t border-[#6f5948]/12 pt-5">
              <p className="font-black text-[#2d2119]">{item.name}</p>
              <p className="text-sm text-[#6f5948]">{item.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function FaqSection() {
  return (
    <Section className="organic-band">
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
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-[#1f8a5b]">{eyebrow}</p>
          <h2 className="text-3xl font-black leading-tight tracking-normal text-[#2d2119] sm:text-5xl">{title}</h2>
          <p className="mt-5 text-base leading-7 text-[#6f5948] sm:text-lg sm:leading-8">{body}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div aria-label={image ? title : undefined} className="relative aspect-[4/3] overflow-hidden rounded-[2.75rem] border border-[#6f5948]/12 bg-[#2d2119] shadow-[0_28px_90px_rgba(92,62,37,0.18)]">
            <div className="absolute inset-0 organic-rings opacity-20" />
            <div className="absolute left-8 top-8 h-28 w-2/5 rounded-[2.5rem] bg-[#8bd8b6]/35" />
            <div className="absolute bottom-8 right-8 h-36 w-1/2 rounded-[3rem] bg-[#ffb38a]/35" />
            <div className="absolute inset-x-8 bottom-8 rounded-[2rem] bg-[#fff7e8] p-5 text-[#2d2119]">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#1f8a5b]">SCORECARE Story</p>
              <p className="mt-2 text-2xl font-black">Credit clarity, arranged beautifully.</p>
            </div>
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
      <div className="responsive-table overflow-x-auto rounded-[1.75rem] border border-[#6f5948]/12 bg-[#fffdf7]/85 shadow-xl shadow-[#6f5948]/10 sm:rounded-[2.25rem]">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-[#2d2119] p-4 text-sm font-black text-[#fff7e8]">
            <span>Feature</span>
            <span>Essential</span>
            <span>Pro</span>
            <span>Elite</span>
          </div>
          {comparisonRows.map((row) => (
            <div key={row[0]} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 border-t border-[#6f5948]/12 p-4 text-sm">
              {row.map((cell) => (
                <span key={cell} className="text-[#6f5948]">{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
