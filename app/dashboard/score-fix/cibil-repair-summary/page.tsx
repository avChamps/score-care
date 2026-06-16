"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { readSelectedCibilRepairAccounts, type SelectedCibilRepairAccount } from "@/lib/cibil-repair-selection";
import { cn } from "@/lib/utils";

type CibilRepairPlan = {
  id?: string;
  publicId?: string;
  planPublicId?: string;
  planName: string;
  amount?: number | null;
  currency?: string;
  gstPercentage?: number | null;
  offerTag?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayPrefill = {
  name: string;
  email: string;
  contact: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

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

function cleanRazorpayContact(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  const contact = digits.length > 10 ? digits.slice(-10) : digits;

  return /^\d{10}$/.test(contact) ? contact : "";
}

async function getRazorpayPrefill(token: string, apiPrefill?: Partial<RazorpayPrefill>) {
  let name = String(apiPrefill?.name || localStorage.getItem("scorecare_full_name") || "").trim();
  let email = String(apiPrefill?.email || localStorage.getItem("scorecare_email") || "").trim();
  let contact = cleanRazorpayContact(apiPrefill?.contact || localStorage.getItem("scorecare_mobile_number"));

  if (!email || !contact) {
    const profileResponse = await apiRequest("/users/me/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileResult = await profileResponse.json();
    const profile = profileResult?.data?.user ?? profileResult?.data?.profile ?? profileResult?.user ?? profileResult?.profile ?? null;

    name = String(name || profile?.fullName || profile?.full_name || profile?.name || "").trim();
    email = String(email || profile?.email || "").trim();
    contact = cleanRazorpayContact(contact || profile?.mobileNumber || profile?.mobile_number || profile?.phone);
  }

  return { name, email, contact };
}

export default function CibilRepairSummaryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SelectedCibilRepairAccount[]>([]);
  const [plans, setPlans] = useState<CibilRepairPlan[]>([]);
  const [timelines, setTimelines] = useState<CibilRepairTimeline[]>([]);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [toast, setToast] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const plan = plans.find((repairPlan) => repairPlan.isActive !== false) ?? plans[0] ?? null;
  const selectedCount = accounts.length;
  const perAccountAmount = plan?.amount ?? 0;
  const finalAmount = selectedCount * perAccountAmount;
  const gstAmount = (finalAmount * (plan?.gstPercentage ?? 0)) / 100;
  const payableAmount = Number((finalAmount + gstAmount).toFixed(2));

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

  useEffect(() => {
    setAccounts(readSelectedCibilRepairAccounts());
  }, []);

  async function handlePayment() {
    if (!selectedCount || !payableAmount || !plan || paymentLoading) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    const planPublicId = plan.planPublicId || plan.publicId || plan.id;
    const planName = plan.planName;
    const currency = plan.currency || "INR";

    if (!planPublicId) {
      setPaymentMessage("Plan is missing. Please try again.");
      return;
    }

    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      await loadRazorpayCheckout();

      const orderResponse = await apiRequest("/cibil-repair-content/payments/orders", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          planPublicId,
          planName,
          amount: payableAmount,
          currency,
        },
      });

      if (orderResponse.status === 401 || orderResponse.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      const orderResult = await orderResponse.json();
      const order = orderResult?.data?.order;
      const prefill = await getRazorpayPrefill(token, orderResult?.data?.prefill);

      if (!orderResponse.ok || !order?.id || !window.Razorpay) {
        throw new Error("Unable to create payment order.");
      }

      console.log("Razorpay Prefill", prefill);

      const checkout = new window.Razorpay({
        key: orderResult?.data?.keyId || orderResult?.data?.razorpayKeyId || order.key,
        amount: order.amount,
        currency: order.currency || currency,
        name: "ScoreCare",
        description: planName,
        order_id: order.id,
        prefill,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        config: {
          display: {
            blocks: {
              upiIntent: {
                name: "Pay with mobile UPI apps",
                instruments: [
                  {
                    method: "upi",
                    flows: ["intent"],
                  },
                ],
              },
              razorpayOptions: {
                name: "Pay with Razorpay",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                  {
                    method: "upi",
                    flows: ["collect"],
                  },
                ],
              },
            },
            sequence: ["block.upiIntent", "block.razorpayOptions"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const requestResponse = await apiRequest("/cibil-repair-content/requests", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: {
                planPublicId,
                planName,
                amount: payableAmount,
                currency,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                remarks: "",
              },
            });

            if (requestResponse.status === 401 || requestResponse.status === 403) {
              clearScorecareSession();
              router.replace("/login");
              return;
            }

            if (!requestResponse.ok) {
              throw new Error("Unable to create repair request.");
            }

            const requestResult = await requestResponse.json();
            setToast(requestResult?.message || "CIBIL repair request submitted successfully.");
            window.setTimeout(() => {
              router.replace("/dashboard/score-fix?tab=credit-improvement-plan");
            }, 1200);
          } catch (error) {
            setPaymentMessage(error instanceof Error ? error.message : "Unable to create repair request.");
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      });

      checkout.open();
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setPaymentLoading(false);
    }
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
            <p className="mt-2 text-caption leading-5 text-[#9fb2c6]"><AnimatedNumber value={selectedCount} /> account{selectedCount === 1 ? "" : "s"} selected · <AnimatedNumber value={issueCount} /> issue{issueCount === 1 ? "" : "s"}</p>

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
                  <p className="mt-3 text-sm font-black text-white"><AnimatedNumber value={formatINR(account.currentBalance)} /></p>
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
                <span className="text-heading font-black text-white"><AnimatedNumber value={formatINR(finalAmount)} /></span>
              </div>
            </div>
          </section>

          <section className={cn("rounded-[1.75rem] p-4", reportCardClass)}>
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#1F756B]">Repair Timeline</p>
            <div className="mt-4 space-y-3">
              {timelines.map((timeline) => (
                <div key={timeline.id} className={cn("flex gap-3 rounded-2xl p-3", reportMiniCardClass)}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#22F2C2]/12 text-caption font-bold text-[#22F2C2]"><AnimatedNumber value={timeline.displayOrder} /></span>
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
            {paymentMessage ? <p className="mb-3 text-center text-caption font-semibold text-red-400">{paymentMessage}</p> : null}
            <button
              className={cn(
                "h-12 w-full rounded-2xl text-sm font-black transition",
                selectedCount && payableAmount && !paymentLoading ? "bg-[linear-gradient(135deg,#22F2C2,#13B98F)] text-[#04120e] shadow-[0_14px_28px_rgba(34,242,194,0.22)]" : "cursor-not-allowed bg-white/10 text-[#6F7B8E]",
              )}
              disabled={!selectedCount || !payableAmount || paymentLoading}
              type="button"
              onClick={handlePayment}
            >
              {paymentLoading ? "Processing..." : <>Pay <AnimatedNumber value={formatINR(finalAmount)} /></>}
            </button>
          </div>
        </div>
      </div>
      {toast ? (
        <div className="fixed left-4 right-4 top-4 z-[10000] mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 shadow-[0_14px_34px_rgba(16,185,129,0.22)]">
          {toast}
        </div>
      ) : null}
      <DashboardBottomNav />
    </PortalShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold text-[#9fb2c6]">{label}</span>
      <span className="text-right font-bold text-white"><AnimatedNumber value={value} /></span>
    </div>
  );
}

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load payment gateway.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load payment gateway."));
    document.body.appendChild(script);
  });
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
