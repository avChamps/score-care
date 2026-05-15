import type { Metadata } from "next";
import { BadgeIndianRupee, Gauge, Headphones, Landmark, ReceiptText, ShieldCheck } from "lucide-react";
import { ScoreCheckCard } from "@/components/dashboard/score-check-card";
import {
  CreditReportBanner,
  ListAction,
  PageContent,
  PortalShell,
  PortalTopBar,
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
        <ScoreCheckCard />

        <div className="grid gap-4">
          <CreditReportBanner />
          <VisualBanner
            icon={<Landmark className="size-7" />}
            title="Loan Eligibility"
            body="Check your eligibility instantly and continue to EMI tools."
            accent="from-blue-600 to-cyan-500"
          />
          <VisualBanner
            icon={<ShieldCheck className="size-7" />}
            title="Score Fix"
            body="Raise disputes, upload reports, and track repair requests."
            accent="from-indigo-600 to-emerald-500"
          />
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

function VisualBanner({
  icon,
  title,
  body,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${accent}`} />
      <div className="relative z-10 pr-24">
        <p className="text-sm font-bold uppercase tracking-tight text-slate-950">{title}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
      </div>
      <div className={`absolute right-5 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-slate-200`}>
        <span className="text-white">{icon}</span>
      </div>
    </div>
  );
}
