import type { Metadata } from "next";
import { Check, CreditCard, Gauge, Info, RotateCcw, Sparkles, TrendingUp, X } from "lucide-react";
import {
  AppCard,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
  SectionTitle,
} from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Credit Score Predictor",
  description: "Simulate possible CIBIL score changes from credit actions.",
};

export default function DashboardCreditScorePage() {
  return (
    <PortalShell active="score">
      <PortalTopBar title="Your CIBIL Score" />
      <PageContent>
        <p className="text-sm font-semibold text-slate-500">Last updated: 21/1/2026</p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-slate-500">
            <Gauge className="size-5" /> Score
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl bg-cyan-50 px-3 py-3 text-sm font-bold text-cyan-700">
            <Sparkles className="size-5" /> Score predictor
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
        <AppCard>
          <div className="flex items-center gap-4">
            <Info className="size-9 text-cyan-600" />
            <h2 className="text-lg font-bold">Simulation only</h2>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            This predictor simulates potential score changes based on your actions. It does not affect your actual credit score or contact credit bureaus.
          </p>
        </AppCard>

        <AppCard className="flex items-center justify-between py-4">
          <span className="text-base font-bold">Current Plan</span>
          <span className="text-2xl font-bold text-cyan-600">762</span>
        </AppCard>
        </div>

        <div>
        <SectionTitle>Simulate Actions</SectionTitle>
        <div className="mt-5 grid gap-5">
          <SliderCard title="Pay credit card dues" subtitle="what % of outstanding dues will you pay ?" value="0%" />
          <SliderCard title="Credit Utilization Target" subtitle="Currently 38% * Target below 30% is deal" value="30%" />
          <ToggleCard title="Close a loan account" subtitle="May reduce credit age if oldest account" tone="neutral" />
          <ToggleCard title="Miss an EMI Payment" subtitle="This will significantly hurt your score" tone="warn" />
          <DurationCard />
        </div>

        <div className="mt-9 grid grid-cols-2 gap-5">
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-700 shadow-sm">
            <RotateCcw className="size-7" /> Reset
          </button>
          <PrimaryPortalButton>
            <TrendingUp className="size-6" /> Predict Score
          </PrimaryPortalButton>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-6 text-slate-500">
          Predictions are estimates based on common credit scoring patterns. Actual results may vary based on complete bureau data
        </p>
        </div>
        </div>
      </PageContent>
    </PortalShell>
  );
}

function SliderCard({ title, subtitle, value }: { title: string; subtitle: string; value: string }) {
  return (
    <AppCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <CreditCard className="mt-1 size-8 text-cyan-600" />
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="text-base font-bold text-slate-700">{value}</span>
      </div>
      <div className="relative mt-9 h-3 rounded-full bg-slate-200">
        <span className="absolute -left-1 -top-5 size-10 rounded-full border-4 border-cyan-500 bg-white shadow" />
      </div>
      <div className="mt-6 flex justify-between text-sm">
        <span className="text-cyan-700">0% (Best)</span>
        <span className="text-slate-400">50%</span>
        <span className="text-rose-300">100%</span>
      </div>
    </AppCard>
  );
}

function ToggleCard({ title, subtitle, tone }: { title: string; subtitle: string; tone: "neutral" | "warn" }) {
  return (
    <AppCard className="flex items-center gap-4">
      <span className="grid size-14 place-items-center rounded-full border border-slate-200 bg-slate-50 text-emerald-500">
        {tone === "warn" ? <Info className="size-8 text-orange-300" /> : <X className="size-7" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">{title}</span>
        <span className="block text-sm text-slate-500">{subtitle}</span>
      </span>
      <span className="relative h-12 w-20 rounded-full bg-cyan-200">
        <span className="absolute left-1 top-1 grid size-10 place-items-center rounded-full bg-white text-cyan-600 shadow">
          <Check className="size-7" />
        </span>
      </span>
    </AppCard>
  );
}

function DurationCard() {
  return (
    <AppCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <CreditCard className="mt-1 size-8 text-cyan-600" />
          <div>
            <h3 className="text-base font-bold">Time Duration</h3>
            <p className="text-sm text-slate-500">How many months ahead to predict</p>
          </div>
        </div>
        <span className="text-base font-bold text-slate-700">3 months</span>
      </div>
      <div className="relative mt-9 h-3 rounded-full bg-cyan-100">
        <span className="absolute left-[72%] top-1/2 size-11 -translate-y-1/2 rounded-full border-4 border-cyan-500 bg-white shadow" />
        <span className="absolute inset-y-0 left-0 w-3/4 rounded-full bg-cyan-500" />
      </div>
      <div className="mt-7 flex justify-between text-sm text-slate-400">
        <span>1 month</span>
        <span>3 months</span>
        <span>6 months</span>
      </div>
    </AppCard>
  );
}
