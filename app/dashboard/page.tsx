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
            accent="bg-[var(--portal-blue)]"
          />
          <VisualBanner
            icon={<ShieldCheck className="size-7" />}
            title="Score Fix"
            body="Raise disputes, upload reports, and track repair requests."
            accent="bg-[var(--portal-orange)]"
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
    <div className="portal-card relative overflow-hidden rounded-[var(--portal-radius)] border p-5">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} />
      <div className="relative z-10 pr-24">
        <p className="text-sm font-black uppercase tracking-tight text-[var(--portal-ink)]">{title}</p>
        <p className="mt-2 text-xs leading-5 text-[var(--portal-muted)]">{body}</p>
      </div>
      <div className={`absolute right-5 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-xl ${accent} text-white shadow-[0_2px_8px_rgba(16,24,40,0.12)]`}>
        <span className="text-white">{icon}</span>
      </div>
    </div>
  );
}
