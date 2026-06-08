import type { Metadata } from "next";
import { BadgeIndianRupee, Gauge, Headphones, ReceiptText } from "lucide-react";
import { CreditHealthCard } from "@/components/dashboard/credit-health-card";
import { DashboardInsightBanners } from "@/components/dashboard/dashboard-insight-banners";
import { ScoreCheckCard } from "@/components/dashboard/score-check-card";
import {
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(21rem,0.78fr)]">
          <ScoreCheckCard />

          <div className="grid gap-4">
            <CreditHealthCard />
            {/* <CreditReportBanner /> */}
            <DashboardInsightBanners />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
            <ListAction
              href="/dashboard/loans"
              icon={<BadgeIndianRupee className="size-7" />}
              title="Apply for Loan"
              subtitle="Eligibility, tenure, and EMI view"
            />
            <ListAction
              href="/dashboard/loans"
              icon={<ReceiptText className="size-7" />}
              title="Loan Repayments"
              subtitle="Upcoming dues and EMI history"
            />
            <ListAction
              href="/dashboard/score-fix"
              icon={<Gauge className="size-7" />}
              title="Fix Your Score"
              subtitle="Disputes, guidance, and follow-ups"
            />
            <ListAction
              href="/pricing"
              icon={<Headphones className="size-7" />}
              title="Concierge Support"
              subtitle="Plans for deeper report assistance"
            />
          </div>
        </div>
      </PageContent>
    </PortalShell>
  );
}
