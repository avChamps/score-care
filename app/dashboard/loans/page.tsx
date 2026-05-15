import type { Metadata } from "next";
import { PageContent, PlusApplyButton, LoanCard, LoanSummaryCard, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Loan Repayments",
  description: "Manage loans, EMI repayments, active accounts, and overdue loan alerts.",
};

export default function DashboardLoansPage() {
  return (
    <PortalShell active="loans">
      <PortalTopBar title="Loan Repayments" />
      <PageContent>
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">EMI workspace</p>
            <h2 className="mt-1 text-2xl font-bold">Manage repayments</h2>
          </div>
          <PlusApplyButton />
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <LoanSummaryCard tone="green" title="Active Loans" value="3" caption="1550000 | 21/1/2026" />
          <LoanSummaryCard tone="red" title="Overdue" value="3" caption="1550000 | Due date:21/1/2026" />
        </div>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-1">
          {["All Loans", "Active", "Completed"].map((tab, index) => (
            <button
              key={tab}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-bold ${
                index === 0 ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-2">
          <LoanCard />
          <LoanCard overdue />
        </div>
      </PageContent>
    </PortalShell>
  );
}
