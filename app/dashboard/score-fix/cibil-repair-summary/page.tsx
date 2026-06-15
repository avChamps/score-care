"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { readSelectedCibilRepairAccounts, type SelectedCibilRepairAccount } from "@/lib/cibil-repair-selection";
import { cn } from "@/lib/utils";

type CibilRepairPlan = {
  id?: string;
  planName: string;
  amount?: number | null;
  currency?: string;
  offerTag?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

type CibilRepairTimeline = {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  isActive?: boolean;
};

const reportCardClass =
  "border border-[#103A2B]/50 bg-[linear-gradient(135deg,#06120E_0%,#081712_50%,#091813_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.02)]";
const reportMiniCardClass = "border border-[#0D5A3F]/55 bg-[linear-gradient(135deg,rgba(9,45,31,0.76),rgba(18,34,24,0.72))]";

export default function CibilRepairSummaryPage() {
  const [accounts] = useState<SelectedCibilRepairAccount[]>(() => readSelectedCibilRepairAccounts());
  const [plans, setPlans] = useState<CibilRepairPlan[]>([]);
  const [timelines, setTimelines] = useState<CibilRepairTimeline[]>([]);
  const [paymentMessage, setPaymentMessage] = useState("");
  const plan = plans.find((repairPlan) => repairPlan.isActive !== false) ?? plans[0] ?? null;
  const selectedCount = accounts.length;
  const perAccountAmount = plan?.amount ?? 0;
  const finalAmount = selectedCount * perAccountAmount;

  useEffect(() => {
    async function loadRepairContent() {
      try {
        const response = await apiRequest("/cibil-repair-content");
        const result = await response.json();

        if (!response.ok || result?.status !== "success") return;

        setPlans(
          (result.data?.plans ?? [])
            .filter((repairPlan: CibilRepairPlan) => repairPlan.isActive !== false)
            .sort((firstPlan: CibilRepairPlan, secondPlan: CibilRepairPlan) => (firstPlan.displayOrder ?? 0) - (secondPlan.displayOrder ?? 0)),
        );
        setTimelines(
          (result.data?.timelines ?? [])
            .filter((timeline: CibilRepairTimeline) => timeline.isActive !== false)
            .sort((firstTimeline: CibilRepairTimeline, secondTimeline: CibilRepairTimeline) => firstTimeline.displayOrder - secondTimeline.displayOrder),
        );
      } catch {
        setPlans([]);
        setTimelines([]);
      }
    }

    void loadRepairContent();
  }, []);

  const issueCount = useMemo(() => accounts.reduce((total, account) => total + account.issueLabels.length, 0), [accounts]);

  function handlePayment() {
    setPaymentMessage("Payment gateway will open here.");
    // TODO: Connect CIBIL repair payment API when backend route is available.
  }

  return (
    <PortalShell active="fix">
      <PortalTopBar title="CIBIL Repair" />
      <div className="min-h-screen bg-[#050912] pb-40 text-white">
        <PageContent className="max-w-md space-y-4">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#9fb2c6]" href="/dashboard/score-fix?tab=credit-improvement-plan">
            <ArrowLeft className="size-4" />
            Back
          </Link>

          <section className={cn("rounded-[1.75rem] p-4", reportCardClass)}>
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#1F756B]">Selected Accounts</p>
            <h1 className="mt-1 text-heading font-black text-white">Repair summary</h1>
            <p className="mt-2 text-caption leading-5 text-[#9fb2c6]">{selectedCount} account{selectedCount === 1 ? "" : "s"} selected · {issueCount} issue{issueCount === 1 ? "" : "s"}</p>

            <div className="mt-4 space-y-3">
              {accounts.length ? accounts.map((account) => (
                <div key={account.id} className={cn("rounded-2xl p-3", reportMiniCardClass)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{account.subscriberName}</p>
                      <p className="mt-1 text-caption text-[#9fb2c6]">{maskAccountNumber(account.accountNumber)}</p>
                    </div>
                    {/* <span className="shrink-0 rounded-full bg-[#1F756B]/12 px-2.5 py-1 text-caption font-semibold text-[#22F2C2]">{account.accountStatus || "--"}</span> */}
                  </div>
                  <p className="mt-3 text-sm font-black text-white">{formatINR(account.currentBalance)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {account.issueLabels.map((label) => (
                      <span key={label} className="rounded-full bg-[#22F2C2]/12 px-2 py-1 text-tiny font-bold text-[#22F2C2]">{label}</span>
                    ))}
                  </div>
                </div>
              )) : (
                <div className={cn("rounded-2xl p-4", reportMiniCardClass)}>
                  <p className="text-sm font-semibold text-white">No accounts selected</p>
                  <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">Go back and select accounts to continue.</p>
                </div>
              )}
            </div>
          </section>

          <section className={cn("rounded-[1.75rem] p-4", reportCardClass)}>
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#1F756B]">Pricing</p>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Plan" value={plan?.planName ?? "--"} />
              <SummaryRow label="Offer" value={plan?.offerTag ?? "--"} />
              <SummaryRow label="Per account" value={formatINR(perAccountAmount)} />
              <SummaryRow label="Selected accounts" value={String(selectedCount)} />
              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-semibold text-[#9fb2c6]">Final payable</span>
                <span className="text-heading font-black text-white">{formatINR(finalAmount)}</span>
              </div>
            </div>
          </section>

          <section className={cn("rounded-[1.75rem] p-4", reportCardClass)}>
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#1F756B]">Repair Timeline</p>
            <div className="mt-4 space-y-3">
              {timelines.map((timeline) => (
                <div key={timeline.id} className={cn("flex gap-3 rounded-2xl p-3", reportMiniCardClass)}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#22F2C2]/12 text-caption font-bold text-[#22F2C2]">{timeline.displayOrder}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{timeline.title}</p>
                    <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">{timeline.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </PageContent>

        <div className="fixed inset-x-0 bottom-[4.75rem] z-30 mx-auto w-full max-w-md px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="rounded-2xl border border-[#0D5A3F]/70 bg-[#071812]/95 p-4 shadow-[0_18px_36px_rgba(0,0,0,0.42)] backdrop-blur">
            {paymentMessage ? <p className="mb-3 text-center text-caption font-semibold text-[#22F2C2]">{paymentMessage}</p> : null}
            <button
              className={cn(
                "h-12 w-full rounded-2xl text-sm font-black transition",
                selectedCount && finalAmount ? "bg-[linear-gradient(135deg,#22F2C2,#13B98F)] text-[#04120e] shadow-[0_14px_28px_rgba(34,242,194,0.22)]" : "cursor-not-allowed bg-white/10 text-[#6F7B8E]",
              )}
              disabled={!selectedCount || !finalAmount}
              type="button"
              onClick={handlePayment}
            >
              Pay {formatINR(finalAmount)}
            </button>
          </div>
        </div>
      </div>
      <DashboardBottomNav />
    </PortalShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold text-[#9fb2c6]">{label}</span>
      <span className="text-right font-bold text-white">{value}</span>
    </div>
  );
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(Math.round(amount));
}

function maskAccountNumber(accountNumber: string) {
  if (!accountNumber) return "--";
  if (/x/i.test(accountNumber)) return accountNumber;

  return accountNumber.length > 4 ? `${"X".repeat(Math.max(accountNumber.length - 4, 3))}${accountNumber.slice(-4)}` : accountNumber;
}
