import type { Metadata } from "next";
import { BadgeIndianRupee, CheckCircle2, LockKeyhole, Smartphone } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { TrustBadges } from "@/components/sections/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Free Credit Score Check",
  description: "Check your credit score with SCORECARE and get instant AI-powered improvement insights.",
};

export default function CreditScorePage() {
  return (
    <>
      <PageHero
        eyebrow="Free score check"
        title="Know your credit score before lenders do."
        body="A polished, mobile-first score check flow with secure consent, instant preview, and next-step recommendations."
        primary="Start free check"
        href="#score-form"
      >
        <Card className="relative overflow-hidden">
          <div className="mx-auto grid size-56 place-items-center rounded-full score-arc">
            <div className="grid size-32 place-items-center rounded-full bg-white shadow-inner dark:bg-slate-950">
              <span className="text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">782</span>
              <span className="-mt-5 text-xs font-bold text-emerald-500">Excellent</span>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">Estimated approval readiness: 92%</p>
        </Card>
      </PageHero>
      <Section id="score-form">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <SectionHeader center={false} eyebrow="Secure form" title="Check your score" body="Dummy form UI ready for backend integration." />
            <div className="grid gap-4">
              {["Full name", "Mobile number", "PAN (optional)", "Monthly income"].map((label) => (
                <label key={label} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {label}
                  <input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-white/5" placeholder={label} />
                </label>
              ))}
              <Button>Get instant preview</Button>
            </div>
          </Card>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { Icon: LockKeyhole, title: "Encrypted journey", text: "Sensitive inputs remain protected in a consent-first workflow." },
              { Icon: Smartphone, title: "OTP-ready flow", text: "Designed for mobile verification and fast continuation." },
              { Icon: BadgeIndianRupee, title: "Loan readiness", text: "See how your score affects cards, loans, and business credit." },
              { Icon: CheckCircle2, title: "Next best actions", text: "Understand the highest-impact score improvements first." },
            ].map(({ Icon, title, text }) => (
              <Card key={title}>
                <Icon className="size-7 text-cyan-500" />
                <h3 className="mt-4 font-bold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>
      <TrustBadges />
    </>
  );
}
