"use client";

import { ArrowLeft, CheckCircle2, LoaderCircle, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { readSelectedCibilRepairAccounts, type SelectedCibilRepairAccount } from "@/lib/cibil-repair-selection";
import { nativeRazorpay } from "@/lib/native-razorpay";
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

type RepairDocumentForm = {
  closingDate: string;
  error: string;
  file: File | null;
  remarks: string;
  uploaded: boolean;
  uploading: boolean;
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
  const [documentForms, setDocumentForms] = useState<Record<string, RepairDocumentForm>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [toast, setToast] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const isUploadingDocuments = accounts.some((account) => documentForms[account.id]?.uploading);
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

  function updateDocumentForm(accountId: string, values: Partial<RepairDocumentForm>) {
    setDocumentForms((currentForms) => {
      const existingForm = currentForms[accountId] ?? {
        closingDate: "",
        error: "",
        file: null,
        remarks: "",
        uploaded: false,
        uploading: false,
      };

      return {
        ...currentForms,
        [accountId]: {
          ...existingForm,
          ...values,
        },
      };
    });
  }

  async function uploadRepairDocuments() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return false;
    }

    for (const account of accounts) {
      const form = documentForms[account.id];

      if (!form?.file) {
        updateDocumentForm(account.id, { error: "Document upload is required." });
        return false;
      }

      if (!form.closingDate) {
        updateDocumentForm(account.id, { error: "Closing date is required." });
        return false;
      }

      const validationError = validateRepairDocumentFile(form.file);

      if (validationError) {
        updateDocumentForm(account.id, { error: validationError });
        return false;
      }
    }

    for (const account of accounts) {
      const form = documentForms[account.id];

      if (!form || form.uploaded || !form.file) continue;

      updateDocumentForm(account.id, { error: "", uploading: true });

      const formData = new FormData();
      formData.append("accountType", account.accountType);
      formData.append(isCreditCardAccount(account.accountType) ? "creditCardNumber" : "loanNumber", account.accountNumber);
      formData.append("closingDate", form.closingDate);
      formData.append("remarks", form.remarks);
      formData.append("file", form.file);

      try {
        const response = await apiRequest("/api/credit-repair/documents", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await response.json().catch(() => null);

        if (response.status === 401 || response.status === 403) {
          clearScorecareSession();
          router.replace("/login");
          return false;
        }

        if (!response.ok || result?.status !== "success") {
          updateDocumentForm(account.id, { error: result?.message || "Document upload failed.", uploading: false });
          return false;
        }

        updateDocumentForm(account.id, { uploaded: true, uploading: false });
      } catch {
        updateDocumentForm(account.id, { error: "Document upload failed.", uploading: false });
        return false;
      }
    }

    setToast("Documents uploaded successfully.");
    setUploadDialogOpen(false);
    window.setTimeout(() => {
      router.replace("/dashboard/score-fix?tab=credit-improvement-plan");
    }, 1000);
    return true;
  }

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
      const useNativeRazorpay = Capacitor.isNativePlatform();

      if (!useNativeRazorpay) {
        await loadRazorpayCheckout();
      }

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
      const razorpayKey = orderResult?.data?.keyId || orderResult?.data?.razorpayKeyId || order?.key;

      if (!orderResponse.ok || !order?.id || !razorpayKey || (!useNativeRazorpay && !window.Razorpay)) {
        throw new Error("Unable to create payment order.");
      }

      async function createRepairRequest(response: RazorpaySuccessResponse) {
        try {
          const requestResponse = await apiRequest("/cibil-repair-content/requests", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: {
              accounts: accounts.map((account) => ({
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                subscriberName: account.subscriberName,
                issueType: account.issueType,
              })),
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
          setSuccessMessage(requestResult?.message || "CIBIL repair request submitted successfully.");
        } catch (error) {
          setPaymentMessage(error instanceof Error ? error.message : "Unable to create repair request.");
        } finally {
          setPaymentLoading(false);
        }
      }

      if (useNativeRazorpay) {
        const paymentResponse = await nativeRazorpay.open({
          amount: order.amount,
          config: {
            display: {
              blocks: {
                paymentOptions: {
                  name: "All Payment Options",
                  instruments: [{ method: "upi", flows: ["intent"] }],
                },
              },
              sequence: ["block.paymentOptions"],
              preferences: { show_default_blocks: false },
            },
          },
          currency: order.currency || currency,
          description: planName,
          key: razorpayKey,
          name: "ScoreCare",
          orderId: order.id,
          prefill,
        });

        await createRepairRequest({
          razorpay_order_id: paymentResponse.razorpay_order_id ?? order.id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        });
        return;
      }

      const RazorpayCheckout = window.Razorpay;

      if (!RazorpayCheckout) {
        throw new Error("Payment gateway is unavailable.");
      }

      const checkout = new RazorpayCheckout({
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || currency,
        name: "ScoreCare",
        description: planName,
        order_id: order.id,
        prefill,
        handler: createRepairRequest,
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
      {successMessage ? (
        <PaymentSuccessDialog
          message={successMessage}
          onSkip={() => router.replace("/dashboard/score-fix?tab=credit-improvement-plan")}
          onUpload={() => setUploadDialogOpen(true)}
        />
      ) : null}
      {uploadDialogOpen ? (
        <RepairDocumentUploadDialog
          accounts={accounts}
          forms={documentForms}
          submitting={isUploadingDocuments}
          onChange={updateDocumentForm}
          onClose={() => setUploadDialogOpen(false)}
          onSubmit={uploadRepairDocuments}
        />
      ) : null}
      <DashboardBottomNav />
    </PortalShell>
  );
}

function PaymentSuccessDialog({ message, onSkip, onUpload }: { message: string; onSkip: () => void; onUpload: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] grid place-items-end bg-black/70 px-4 pb-6 text-white backdrop-blur-md sm:place-items-center sm:pb-0">
      <div className="w-full max-w-md rounded-[28px] border border-[#22F2C2]/25 bg-[linear-gradient(145deg,#061A13,#082519)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#22F2C2]/12 text-[#22F2C2]">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="mt-4 text-center text-lg font-black">Payment successful</h2>
        <p className="mt-2 text-center text-caption leading-5 text-[#AAB6C8]">{message}</p>
        <div className="mt-5 grid gap-3">
          <button className="h-12 rounded-[18px] bg-[linear-gradient(135deg,#08DB69,#22F2C2)] text-sm font-black text-[#031812] shadow-[0_12px_28px_rgba(8,219,105,0.28)]" type="button" onClick={onUpload}>
            Upload documents
          </button>
          <button className="h-12 rounded-[18px] border border-white/10 bg-white/[0.05] text-sm font-bold text-[#AAB6C8]" type="button" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

function RepairDocumentUploadDialog({
  accounts,
  forms,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  accounts: SelectedCibilRepairAccount[];
  forms: Record<string, RepairDocumentForm>;
  onChange: (accountId: string, values: Partial<RepairDocumentForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto overflow-x-hidden bg-[#050912] text-white backdrop-blur-md">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
        <div className="rounded-[28px] border border-[#00CFA4]/25 bg-[radial-gradient(circle_at_100%_0%,rgba(34,242,194,0.12),transparent_34%),linear-gradient(145deg,#061A13,#082519)] p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-[#22F2C2]">
              <Upload className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-caption font-black uppercase tracking-[0.22em] text-[#22F2C2]">Upload Documents</p>
              <h2 className="mt-2 text-lg font-black tracking-tight text-white">Repair documents</h2>
              <p className="mt-1 text-caption text-[#AAB6C8]">Upload documents for the selected accounts.</p>
            </div>
            <button aria-label="Close upload documents" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-white" type="button" onClick={onClose}>
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {accounts.map((account) => {
            const form = forms[account.id];
            const numberLabel = isCreditCardAccount(account.accountType) ? "Credit card number" : "Loan number";

            return (
              <section key={account.id} className="rounded-[24px] border border-[#1F756B]/25 bg-[linear-gradient(145deg,#09131F,#0D1827)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
                <p className="text-sm font-black text-white">{account.subscriberName}</p>
                <div className="mt-4 space-y-4">
                  <RepairDocumentField label={numberLabel}>
                    <input className="h-12 w-full rounded-[18px] border border-white/10 bg-[#101B2B] px-4 text-body font-medium text-white outline-none" readOnly value={account.accountNumber} />
                  </RepairDocumentField>
                  <RepairDocumentField label="Document" required>
                    <label className="grid min-h-28 cursor-pointer place-items-center rounded-[20px] border border-dashed border-[#22F2C2]/30 bg-[#0A1725] px-4 text-center text-[#AAB6C8]">
                      <input
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        className="sr-only"
                        required
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          onChange(account.id, { error: file ? validateRepairDocumentFile(file) : "", file, uploaded: false });
                        }}
                      />
                      <span className="w-full min-w-0">
                        <Upload className="mx-auto size-8 text-[#22F2C2]" />
                        <span className="mt-3 block truncate text-xs font-bold text-white">{form?.file?.name || "Choose document"}</span>
                        <span className="mt-2 block text-caption text-[#AAB6C8]">PDF, JPG, JPEG, or PNG. Max 5MB.</span>
                      </span>
                    </label>
                  </RepairDocumentField>
                  <RepairDocumentField label="Closing date" required>
                    <input className="h-12 w-full rounded-[18px] border border-white/10 bg-[#101B2B] px-4 text-body font-medium text-white outline-none" required type="date" value={form?.closingDate ?? ""} onChange={(event) => onChange(account.id, { closingDate: event.target.value, uploaded: false })} />
                  </RepairDocumentField>
                  <RepairDocumentField label="Remarks">
                    <textarea className="min-h-24 w-full resize-none rounded-[18px] border border-white/10 bg-[#101B2B] px-4 py-3 text-body font-medium text-white outline-none" value={form?.remarks ?? ""} onChange={(event) => onChange(account.id, { remarks: event.target.value, uploaded: false })} />
                  </RepairDocumentField>
                  {form?.error ? <p className="rounded-2xl border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 px-4 py-3 text-sm font-medium text-[#FF8AAB]">{form.error}</p> : null}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 border-t border-white/10 pt-4">
          <button className="h-12 rounded-[18px] bg-[linear-gradient(135deg,#08DB69,#22F2C2)] text-sm font-black text-[#031812] shadow-[0_12px_28px_rgba(8,219,105,0.28)] disabled:opacity-60" disabled={submitting} type="button" onClick={onSubmit}>
            {submitting ? (
              <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Uploading...</span>
            ) : (
              "Submit documents"
            )}
          </button>
          <button className="h-12 rounded-[18px] border border-white/10 bg-white/[0.05] text-sm font-bold text-[#AAB6C8]" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RepairDocumentField({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-caption font-semibold text-[#DDE7F4]">
        {label} {required ? <span className="text-[#FF5C8A]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function isCreditCardAccount(accountType: string) {
  return accountType.toLowerCase().includes("credit card") || accountType === "10" || accountType === "31" || accountType === "35" || accountType === "36";
}

function getRepairDocumentType(accountType: string) {
  return isCreditCardAccount(accountType) ? "Credit card closure proof" : "Loan closure proof";
}

function validateRepairDocumentFile(file: File) {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
  const hasAllowedType = allowedTypes.includes(file.type);
  const hasAllowedExtension = allowedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension));

  if (!hasAllowedType && !hasAllowedExtension) {
    return "Only PDF, JPG, JPEG, or PNG files are allowed.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "File size must be 5MB or less.";
  }

  return "";
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
