import type { Metadata } from "next";
import { BadgeIndianRupee, Gauge, Headphones, ReceiptText } from "lucide-react";
import {
  AppCard,
  CreditReportBanner,
  ListAction,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
  ScoreGauge,
} from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Logged-in SCORECARE app home with credit score, loans, repair, and bill payment actions.",
};

export default function DashboardPage() {
  return (
    <PortalShell active="home">
      <PortalTopBar />
      <PageContent>
        <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <AppCard className="xl:row-span-2">
          <p className="text-base font-bold">Your CIBIL Score</p>
          <p className="text-sm text-slate-500">Last checked: 10/02/2026, 10:30PM</p>
          <ScoreGauge />
          <ScoreLegend />
          <PrimaryPortalButton href="/dashboard/credit-score" className="mt-7 w-full">
            Check Your Credit Score
          </PrimaryPortalButton>
        </AppCard>

        <CreditReportBanner />

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="size-2 rounded-full bg-slate-300" />
          <span className="h-2 w-8 rounded-full bg-cyan-500" />
          <span className="size-2 rounded-full bg-slate-300" />
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:col-span-2">
          <ListAction
            href="/dashboard/loans"
            icon={<BadgeIndianRupee className="size-7" />}
            title="Apply for Loan"
            subtitle="Check your eligibility instantly"
          />
          <ListAction
            href="/dashboard/loans"
            icon={<ReceiptText className="size-7" />}
            title="Loan Repayments"
            subtitle="Pay your EMIs on time"
          />
          <ListAction
            href="/dashboard/score-fix"
            icon={<Gauge className="size-7" />}
            title="Fix Your Score"
            subtitle="Raise dispute or get guidance"
          />
          <ListAction
            href="/pricing"
            icon={<Headphones className="size-7" />}
            title="Subscription plans"
            subtitle="View available plans and premium benefits."
          />
        </div>
        </div>
      </PageContent>
    </PortalShell>
  );
}

function ScoreLegend() {
  const items = [
    ["bg-red-500", "Poor - (300-549)"],
    ["bg-lime-300", "Fair - (550-649)"],
    ["bg-emerald-400", "Good - (650-749)"],
    ["bg-green-500", "Excellent - (750-900)"],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-slate-600">
      {items.map(([color, label]) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`size-3 rounded-full ${color}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
