"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import Image from "next/image";
import subscriptionBenefitsImage from "@/assets/subscription-benefits.png";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Check, CreditCard, FileWarning, TrendingUp, Trophy, X, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { clearCachedCibilDisplayData, getCachedCibilDisplayData } from "@/lib/cibil-display-cache";
import { nativeRazorpay } from "@/lib/native-razorpay";
import { logCrashlyticsMessage, trackEvent } from "@/src/lib/analytics";

export type SubscriptionPlan = {
  id: string;
  publicId?: string;
  planName: string;
  amount: number;
  gstPercentage?: number;
  billingCycle?: string;
  currency?: string;
  badge: string;
  icon: string;
  title?: string;
  subtitle?: string;
  description?: string;
  benefits: SubscriptionBenefit[];
  comparisonBenefits: ComparisonBenefitRow[];
  buttonLabel?: string;
  skipLabel?: string;
  features: string[];
  moreFeatures?: string;
  theme: "blue" | "purple" | "green" | "orange" | "pink" | "cyan";
};

export type SubscriptionBenefit = {
  title: string;
  description: string;
};

export type ComparisonBenefitValue = boolean | string;
export type ComparisonBenefitRow = {
  benefit: string;
  free: ComparisonBenefitValue;
  scorecarePro: ComparisonBenefitValue;
};

type RazorpaySubscriptionResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
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

const subscriptionPlanThemes: Array<SubscriptionPlan["theme"]> = ["blue", "purple", "green", "orange", "pink", "cyan"];
const subscriptionPlanThemeStyles: Record<SubscriptionPlan["theme"], { accent: string; header: string; selectedRing: string }> = {
  blue: { accent: "#2878FF", header: "bg-[#2673F1]", selectedRing: "ring-[#2878FF]" },
  purple: { accent: "#A248F5", header: "bg-[#A246F2]", selectedRing: "ring-[#A248F5]" },
  green: { accent: "#19B879", header: "bg-[#07844E]", selectedRing: "ring-[#19B879]" },
  orange: { accent: "#FF8A00", header: "bg-[#F97316]", selectedRing: "ring-[#FF8A00]" },
  pink: { accent: "#F43F8A", header: "bg-[#DB2777]", selectedRing: "ring-[#F43F8A]" },
  cyan: { accent: "#06B6D4", header: "bg-[#0891B2]", selectedRing: "ring-[#06B6D4]" },
};

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "pro",
    planName: "Pro",
    amount: 299,
    badge: "Most Popular",
    icon: "🚀",
    theme: "blue",
    title: "Unlock premium features",
    subtitle: "Subscribe",
    description: "Choose a plan to continue using reports, health insights, and predictor tools.",
    benefits: [],
    comparisonBenefits: [],
    features: [
      "Unlimited score checks",
      "All 4 bureaus — live",
      "12-month history",
      "AI Credit Coach weekly",
      "Score Simulator",
      "Dispute filing (3/mo)",
      "Loan payment tracking",
      "EMI reminders",
    ],
  },
  {
    id: "elite",
    planName: "Elite",
    amount: 599,
    badge: "Best Value",
    icon: "💎",
    theme: "purple",
    title: "Unlock premium features",
    subtitle: "Subscribe",
    description: "Choose a plan to continue using reports, health insights, and predictor tools.",
    benefits: [],
    comparisonBenefits: [],
    features: [
      "Everything in Pro",
      "All bureaus — daily sync",
      "Unlimited disputes",
      "Managed credit repair",
    ],
    moreFeatures: "+4 more features...",
  },
];

let subscriptionPlansRequest: Promise<SubscriptionPlan[]> | null = null;

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

export async function getSubscriptionPlans() {
  if (!subscriptionPlansRequest) {
    subscriptionPlansRequest = apiRequest("/subscription-plans")
      .then(async (response) => {
        if (!response.ok) {
          return [];
        }

        return readSubscriptionPlans(await response.json());
      })
      .catch(() => []);
  }

  return subscriptionPlansRequest;
}

export function useSubscribePrompt() {
  const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);

  function promptSubscribe() {
    setShowSubscribePrompt(true);
  }

  function closeSubscribePrompt() {
    setShowSubscribePrompt(false);
  }

  return { closeSubscribePrompt, promptSubscribe, showSubscribePrompt };
}

function ProComparisonValue({ value }: { value: ComparisonBenefitValue }) {
  if (value === true || value === "check") {
    return (
      <span className="mx-auto grid size-5 place-items-center rounded-full bg-[#0EBA6D] text-white">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }

  if (value === false || value === "close") {
    return (
      <span className="mx-auto grid size-5 place-items-center rounded-full bg-[#F04438] text-white">
        <X className="size-3.5" strokeWidth={3} />
      </span>
    );
  }

  return <span className="text-[11px] font-bold text-[#AAB6C8]">{String(value)}</span>;
}

export function ProBenefitsComparisonSheet({ comparisonBenefits = [], ctaLabel = "View Subscription", loading = false, onClose, onSubscribe, zIndex = "z-[110]" }: { comparisonBenefits?: ComparisonBenefitRow[]; ctaLabel?: string; loading?: boolean; onClose: () => void; onSubscribe: () => void; zIndex?: string }) {
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end bg-black/65 px-0 backdrop-blur-sm sm:px-4`}>
      <section className="mx-auto max-h-[calc(100dvh-12px)] w-full max-w-md overflow-y-auto animate-[creditPanelIn_0.22s_ease-out] rounded-t-[30px] bg-[#0D131C] px-4 pb-4 pt-5 shadow-[0_-24px_70px_rgba(0,0,0,0.42)]">
        <button
          className="ml-auto grid size-8 place-items-center rounded-full bg-white/12 text-white backdrop-blur"
          type="button"
          aria-label="Close benefits"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>

        <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22D3EE]">Before you leave</p>
        <h2 className="mt-2 text-center text-xl font-extrabold leading-6 text-white">Why Choose ScoreCare Pro?</h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#111821] text-left shadow-[0_16px_34px_rgba(0,0,0,0.24)]">
          <div className="grid grid-cols-[1.45fr_0.72fr_0.95fr] bg-white/[0.06] text-[11px] font-extrabold uppercase text-[#5EF2C2]">
            <div className="px-2.5 py-2.5">Benefits</div>
            <div className="bg-[#0D131C] px-2 py-2.5 text-center">Free</div>
            <div className="bg-[#112536] px-2 py-2.5 text-center">ScoreCare Pro</div>
          </div>

          {comparisonBenefits.map((row) => (
            <div key={row.benefit} className="grid grid-cols-[1.45fr_0.72fr_0.95fr] border-t border-white/10 text-[12px] leading-4 text-[#D7E0EA]">
              <div className="flex min-h-9 items-center px-2.5 py-1.5 font-semibold">{row.benefit}</div>
              <div className="flex min-h-9 items-center justify-center bg-[#0D131C] px-2 py-1.5 text-center">
                <ProComparisonValue value={row.free} />
              </div>
              <div className="flex min-h-9 items-center justify-center bg-[#112536] px-2 py-1.5 text-center">
                <ProComparisonValue value={row.scorecarePro} />
              </div>
            </div>
          ))}
        </div>

        <button className="mt-4 h-12 w-full rounded-[14px] bg-[#08DB69] text-base font-bold text-[#201300]]" disabled={loading} type="button" onClick={onSubscribe}>
          {loading ? "Processing..." : ctaLabel}
        </button>
        <button className="mx-auto mt-2.5 block text-sm font-semibold text-[#6F7B8E]" type="button" onClick={onClose}>
       I don&apos;t want to increase my credit score.
        </button>
      </section>
    </div>
  );
}


const premiumBenefitIcons = [TrendingUp, FileWarning, Bot, CreditCard, Trophy];


function TwelveHourTimer({ className = "" }: { className?: string }) {
  const [endsAt] = useState(() => Date.now() + 12 * 60 * 60 * 1000);
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(Math.max(0, endsAt - Date.now()));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [endsAt]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return (
    <span className={className}>
      {hours}:{minutes}:{seconds}
    </span>
  );
}

export function PremiumBenefitsIntro({ benefits = [], ctaLabel = "View subscription", loading = false, onClose, onSubscribe }: { benefits?: SubscriptionBenefit[]; ctaLabel?: string; loading?: boolean; onClose: () => void; onSubscribe: () => void }) {
  return (
    <div className="flex min-h-full flex-col bg-[#0D131C]">
      <div className="flex h-14 shrink-0 items-center bg-[#0D131C] px-4">
        <button className="grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur" type="button" aria-label="Back from benefits" onClick={onClose}>
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="relative mx-4 shrink-0 overflow-hidden rounded-[16px] bg-[#F4F8FF]">
        <div className="relative aspect-[1.82] w-full">
          <Image
            src={subscriptionBenefitsImage}
            alt="Boost your credit score to 750+"
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-contain object-top"
            priority
          />
        </div>
      </div>

     <div className="flex min-h-0 flex-1 flex-col bg-[#0D131C] px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-5">
  <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.06]">
    {benefits.map((benefit, index) => {
      const Icon = premiumBenefitIcons[index % premiumBenefitIcons.length];

      return (
        <div
          key={`${benefit.title}-${index}`}
          className={`grid grid-cols-[4.75rem_1fr] items-center gap-3 px-4 py-3.5 min-[390px]:py-4 ${
            index !== benefits.length - 1
              ? "border-b border-white/10"
              : ""
          }`}
        >
          <motion.span
            className="grid size-14 place-items-center rounded-[18px] bg-[#111821] text-[#5EF2C2] shadow-[0_0_18px_rgba(94,242,194,0.18)] min-[390px]:size-16"
            animate={{
              scale: [1, 1.08, 1],
              rotate: [0, -4, 4, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: index * 0.18,
            }}
          >
            <Icon className="size-6" strokeWidth={1.8} />
          </motion.span>

          <div>
            <p className="text-[15px] font-bold leading-5 text-white">
              {benefit.title}
            </p>

            <p className="mt-1.5 text-[12px] font-medium leading-[18px] text-[#AAB6C8]">
              {benefit.description}
            </p>
          </div>
        </div>
      );
    })}
  </div>

  <div className="mt-auto mb-3 flex justify-end pr-1 pt-8 text-[12px] font-semibold text-[#AAB6C8]">
    <span>Offer closes in&nbsp;</span>
    <TwelveHourTimer className="font-bold text-[#FFD34D]" />
  </div>

  <button
    className="h-16 w-full rounded-[24px] bg-[#08DB69] text-[20px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
    disabled={loading}
    type="button"
    onClick={onSubscribe}
  >
    {loading ? "Processing..." : ctaLabel}
  </button>
</div>
    </div>
  );
}

export function SubscribePromptOverlay({
  onClose,
  onPaymentFlowStart,
  onPaymentLoadingChange,
  paymentTrigger = 0,
  show,
}: {
  onClose: () => void;
  onPaymentFlowStart?: () => void;
  onPaymentLoadingChange?: (loading: boolean) => void;
  paymentTrigger?: number;
  show: boolean;
}) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState(subscriptionPlans[0].id);
  const [showPlans, setShowPlans] = useState(false);
  const [showSkipMessage, setShowSkipMessage] = useState(false);
  const [plans, setPlans] = useState(subscriptionPlans);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];

  async function loadSubscriptionPlans() {
    try {
      const apiPlans = await getSubscriptionPlans();
      const nextPlans = apiPlans.length ? apiPlans : subscriptionPlans;

      setPlans(nextPlans);
      setSelectedPlanId(nextPlans[0].id);

      return nextPlans;
    } catch {
      setPlans(subscriptionPlans);

      return subscriptionPlans;
    }
  }

  useEffect(() => {
    if (!show) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setShowPlans(false);
      setShowSkipMessage(false);
      setPaymentMessage("");
    }, 0);

    void loadSubscriptionPlans();

    return () => window.clearTimeout(resetTimer);
  }, [show]);

  useEffect(() => {
    onPaymentLoadingChange?.(paymentLoading);
  }, [onPaymentLoadingChange, paymentLoading]);

  useEffect(() => {
    if (!paymentTrigger) {
      return;
    }

    let isActive = true;

    void loadSubscriptionPlans().then((nextPlans) => {
      if (isActive) {
        void handleSubscriptionPayment(nextPlans[0]);
      }
    });

    return () => {
      isActive = false;
    };
  }, [paymentTrigger]);

  useEffect(() => {
    if (!show || !showPlans || !selectedPlan) {
      return;
    }

    void trackEvent("subscription_plan_viewed", {
      page_name: "subscription",
      plan_public_id: selectedPlan.publicId || selectedPlan.id,
    });
  }, [selectedPlan, show, showPlans]);

  function closePrompt(event: MouseEvent) {
    event.stopPropagation();
    setShowSkipMessage(true);
  }

  async function handleSubscriptionPayment(paymentPlan = selectedPlan) {
    if (!paymentPlan || paymentLoading) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    const authToken = token;
    const planPublicId = paymentPlan.publicId || paymentPlan.id;
    const selectedPlanPayableAmount = calculatePlanPayableAmount(paymentPlan, paymentPlan);
    const selectedPlanGstAmount = calculatePlanGstAmount(paymentPlan, paymentPlan);
    const selectedPlanRazorpayAmount = toRazorpayAmount(selectedPlanPayableAmount);

    if (!Number.isFinite(selectedPlanPayableAmount) || !Number.isFinite(selectedPlanRazorpayAmount)) {
      setPaymentMessage("Unable to load subscription amount. Please try again.");
      return;
    }

    setPaymentLoading(true);
    setPaymentMessage("");
    void trackEvent("razorpay_payment_started", {
      page_name: "subscription",
      payment_status: "started",
      plan_public_id: planPublicId,
    });
    void logCrashlyticsMessage("Payment started");

    try {
      const useNativeRazorpay = Capacitor.getPlatform() === "android";

      if (!useNativeRazorpay) {
        await loadRazorpayCheckout();
      }

      const subscriptionResponse = await apiRequest(`/subscription-plans/${encodeURIComponent(planPublicId)}/razorpay-subscription`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          amount: selectedPlanPayableAmount,
          amountInPaise: selectedPlanRazorpayAmount,
          baseAmount: paymentPlan.amount,
          finalAmount: selectedPlanPayableAmount,
          gstAmount: selectedPlanGstAmount,
          gstPercentage: paymentPlan.gstPercentage ?? 0,
          payableAmount: selectedPlanPayableAmount,
          payableAmountInPaise: selectedPlanRazorpayAmount,
          razorpayAmount: selectedPlanRazorpayAmount,
          totalAmount: selectedPlanPayableAmount,
          totalAmountInPaise: selectedPlanRazorpayAmount,
          totalCount: 36,
          customerNotify: true,
        },
      });

      if (subscriptionResponse.status === 401 || subscriptionResponse.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      const subscriptionResult = await subscriptionResponse.json();
      const data = subscriptionResult?.data ?? subscriptionResult;
      const order = data?.order;
      const plan = data?.plan ?? paymentPlan;
      const prefill = await getRazorpayPrefill(authToken, data?.prefill);
      const payableAmount = calculatePlanPayableAmount(plan, paymentPlan);
      const gstAmount = calculatePlanGstAmount(plan, paymentPlan);

      if (!subscriptionResponse.ok || !data?.keyId || !order?.id || !data?.customerId || data?.recurring !== "1" || (!useNativeRazorpay && !window.Razorpay)) {
        throw new Error("Unable to create subscription.");
      }

      async function confirmSubscription(response: RazorpaySubscriptionResponse) {
        try {
          const confirmResponse = await apiRequest("/subscription-plans/razorpay/confirm", {
            method: "POST",
            headers: { Authorization: `Bearer ${authToken}` },
            body: {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id ?? order?.id,
              razorpaySignature: response.razorpay_signature,
              amount: payableAmount,
              baseAmount: Number(plan.amount ?? paymentPlan.amount),
              currency: plan.currency ?? paymentPlan.currency ?? "INR",
              finalAmount: payableAmount,
              gstAmount,
              gstPercentage: Number(plan.gstPercentage ?? paymentPlan.gstPercentage ?? 0),
              payableAmount,
              totalAmount: payableAmount,
            },
          });

          if (confirmResponse.status === 401 || confirmResponse.status === 403) {
            clearScorecareSession();
            router.replace("/login");
            return;
          }

          const confirmResult = await confirmResponse.json();

          if (!confirmResponse.ok || confirmResult?.status !== "success") {
            throw new Error("Unable to confirm subscription.");
          }

          void trackEvent("razorpay_payment_success", {
            page_name: "subscription",
            payment_status: "success",
            plan_public_id: planPublicId,
          });
          void trackEvent("subscription_activated", {
            page_name: "subscription",
            subscription_status: "active",
            plan_public_id: planPublicId,
          });
          void logCrashlyticsMessage("Payment confirm API success");
          clearSubscriptionPaymentCache();
          await Promise.allSettled([
            fetchSubscriptionStatus(authToken),
            getRazorpayPrefill(authToken),
            getCachedCibilDisplayData(authToken, { forceRefresh: true }),
          ]);
          window.dispatchEvent(new CustomEvent("scorecare:subscription-activated", { detail: confirmResult?.subscription ?? confirmResult?.data?.subscription ?? null }));
          onClose();
          router.replace("/dashboard?subscription=success");
        } catch (error) {
          void trackEvent("razorpay_payment_failed", {
            page_name: "subscription",
            payment_status: "confirm_failed",
            plan_public_id: planPublicId,
          });
          void logCrashlyticsMessage("Payment confirm API failure");
          setPaymentMessage(error instanceof Error ? error.message : "Unable to confirm subscription.");
        } finally {
          setPaymentLoading(false);
        }
      }

      if (useNativeRazorpay) {
        onPaymentFlowStart?.();
        const paymentResponse = await nativeRazorpay.open({
          amount: toRazorpayAmount(payableAmount),
          currency: order.currency ?? plan.currency ?? paymentPlan.currency ?? "INR",
          customerId: data.customerId,
          description: plan.planName ?? paymentPlan.planName,
          key: data.keyId,
          name: "ScoreCare",
          orderId: order.id,
          prefill,
          recurring: data.recurring,
        });

        await confirmSubscription(paymentResponse);
        return;
      }

      const RazorpayCheckout = window.Razorpay;

      if (!RazorpayCheckout) {
        throw new Error("Payment gateway is unavailable.");
      }

      const checkout = new RazorpayCheckout({
        key: data.keyId,
        amount: toRazorpayAmount(payableAmount),
        order_id: order.id,
        customer_id: data.customerId,
        recurring: data.recurring,
        name: "ScoreCare",
        description: plan.planName ?? paymentPlan.planName,
        prefill,
        handler: confirmSubscription,
        modal: {
          ondismiss: () => {
            void trackEvent("razorpay_payment_failed", {
              page_name: "subscription",
              payment_status: "dismissed",
              plan_public_id: planPublicId,
            });
            setPaymentLoading(false);
          },
        },
      });

      checkout.open();
      onPaymentFlowStart?.();
    } catch (error) {
      void trackEvent("razorpay_payment_failed", {
        page_name: "subscription",
        payment_status: "failed",
        plan_public_id: planPublicId,
      });
      void logCrashlyticsMessage("Payment setup failure");
      setPaymentMessage(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setPaymentLoading(false);
    }
  }

  const sheet: ReactNode = (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end bg-[#050910]/70 px-3 pt-[calc(var(--native-status-offset,0px)+2rem)] backdrop-blur-[5px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closePrompt}
        >
          <motion.div
            className="relative mx-auto flex h-[calc(100dvh-var(--native-status-offset,0px)-4rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-[#0D131C] text-white shadow-[0_-24px_80px_rgba(0,0,0,0.42)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            {showPlans ? (
              <>
                <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_80%_0%,rgba(94,242,194,0.18),transparent_34%),linear-gradient(180deg,#151E2A_0%,#0D131C_100%)]" />
                <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 sm:px-6">
                  <div className="mx-auto h-1.5 w-12 rounded-full bg-white/16" />
                  <div className="relative mx-auto mt-5 flex max-w-md items-start justify-between gap-4">
                    <div>
                      <p className="text-caption font-semibold uppercase tracking-[3px] text-[#FFD34D]">{selectedPlan.subtitle}</p>
                      <h2 className="mt-2 text-heading font-semibold leading-7 text-white">{selectedPlan.title}</h2>
                      <p className="mt-2 text-caption font-medium leading-5 text-[#AAB6C8]">{selectedPlan.description}</p>
                    </div>
                    <button
                      aria-label="Close subscription prompt"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-white/8 text-[#AAB6C8] shadow-[0_10px_22px_rgba(0,0,0,0.18)] transition hover:bg-white/12 hover:text-white"
                      onClick={closePrompt}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="relative mx-auto mt-6 grid max-w-md gap-5 pb-4">
                    {plans.map((plan) => (
                      <SubscriptionPlanCard
                        key={plan.id}
                        plan={plan}
                        selected={selectedPlanId === plan.id}
                        onSelect={() => setSelectedPlanId(plan.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative border-t border-white/8 bg-[#0D131C] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
                  {paymentMessage ? <p className="mx-auto mb-3 max-w-md text-center text-caption font-semibold text-red-400">{paymentMessage}</p> : null}
                  <button className="mx-auto block h-[3.25rem] w-full max-w-md rounded-2xl bg-[linear-gradient(135deg,#FF7A00,#FFD34D)] text-sm font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)] transition disabled:opacity-60" disabled={!selectedPlanId || paymentLoading} type="button" onClick={() => void handleSubscriptionPayment()}>
                    {paymentLoading ? "Processing..." : selectedPlan.buttonLabel ?? "Subscribe"}
                  </button>
                  <button className="mx-auto mt-3 block text-xs font-semibold text-[#AAB6C8] transition hover:text-white" onClick={closePrompt} type="button">
                    {selectedPlan.skipLabel}
                  </button>
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PremiumBenefitsIntro benefits={selectedPlan.benefits} ctaLabel={`Pay ${formatPlanAmount(selectedPlan)} ${formatBillingCycle(selectedPlan.billingCycle)}`} loading={paymentLoading} onClose={() => setShowSkipMessage(true)} onSubscribe={() => void handleSubscriptionPayment()} />
              </div>
            )}
            {showSkipMessage ? (
              <ProBenefitsComparisonSheet
                comparisonBenefits={selectedPlan.comparisonBenefits}
                ctaLabel={`Pay ${formatPlanAmount(selectedPlan)} ${formatBillingCycle(selectedPlan.billingCycle)}`}
                loading={paymentLoading}
                zIndex="z-[10000]"
                onClose={() => {
                  setShowSkipMessage(false);
                  onClose();
                }}
                onSubscribe={() => {
                  setShowSkipMessage(false);
                  void handleSubscriptionPayment();
                }}
              />
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return typeof document === "undefined" ? null : createPortal(sheet, document.body);
}

function SubscriptionPlanCard({ onSelect, plan, selected }: { onSelect: () => void; plan: SubscriptionPlan; selected: boolean }) {
  const theme = subscriptionPlanThemeStyles[plan.theme];

  return (
    <button
      className={`overflow-hidden rounded-[26px] bg-[#101E2E] text-left shadow-[0_18px_36px_rgba(0,0,0,0.28)] transition ${selected ? `ring-2 ${theme.selectedRing}` : "ring-1 ring-white/8"
        }`}
      onClick={onSelect}
      type="button"
    >
      <div className={`relative px-6 py-6 ${theme.header}`}>
        <span className="inline-flex rounded-full bg-white/16 px-2.5 py-1 text-caption font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.12)]">
          ⭐ {plan.badge}
        </span>
        <span className="absolute right-6 top-16 grid size-8 place-items-center rounded-full border-[5px] border-white/90">
          {selected ? <span className="size-3 rounded-full bg-white" /> : null}
        </span>
        <div className="mt-5 flex items-center gap-2.5 text-heading font-extrabold text-white">
          <span>{plan.icon}</span>
          <span>{plan.planName}</span>
        </div>
        <p className="mt-4 text-[34px] font-black leading-none text-white"><AnimatedNumber value={formatPlanAmount(plan)} /><span className="ml-1 text-caption font-bold text-white/76">{formatBillingCycle(plan.billingCycle)}</span></p>
      </div>

      <div className="space-y-3 px-7 py-6">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-base font-semibold text-white/90">
            <span className="grid size-6 shrink-0 place-items-center rounded-full text-body-sm shadow-[0_8px_16px_rgba(0,0,0,0.22)]" style={{ backgroundColor: `${theme.accent}24`, color: theme.accent }}>
              ✓
            </span>
            <span>{feature}</span>
          </div>
        ))}
        {plan.moreFeatures ? <p className="pt-1 text-body font-semibold text-white/20">{plan.moreFeatures}</p> : null}
      </div>
    </button>
  );
}

export function readSubscriptionPlans(result: unknown): SubscriptionPlan[] {
  const value = result as { data?: unknown; plans?: unknown };
  const data = value?.data as { plans?: unknown } | unknown[];
  const plans = Array.isArray(data) ? data : Array.isArray(data?.plans) ? data.plans : Array.isArray(value?.plans) ? value.plans : [];
  const normalizedPlans: SubscriptionPlan[] = [];

  plans.forEach((plan, index) => {
    const item = plan as Partial<SubscriptionPlan> & { comparisonBenefits?: unknown; gst?: number; gst_percentage?: number; name?: string; offerTag?: string; price?: number; monthlyPrice?: number };
    const id = String(item.publicId ?? item.id ?? item.planName ?? item.name ?? index);
    const planName = String(item.planName ?? item.name ?? "");
    const amount = Number(item.amount ?? item.price ?? item.monthlyPrice ?? 0);
    const gstPercentage = Number(item.gstPercentage ?? item.gst_percentage ?? item.gst ?? 0);

    if (!planName || !amount) {
      return;
    }

    normalizedPlans.push({
      id,
      publicId: item.publicId,
      planName,
      amount,
      gstPercentage: Number.isFinite(gstPercentage) ? gstPercentage : 0,
      billingCycle: item.billingCycle,
      currency: item.currency,
      badge: item.badge ?? item.offerTag ?? (index === 0 ? "Most Popular" : "Best Value"),
      icon: item.icon ?? (index === 0 ? "🚀" : "💎"),
      title: item.title ?? "Unlock premium features",
      subtitle: item.subtitle ?? "Subscribe",
      description: item.description ?? "Choose a plan to continue using reports, health insights, and predictor tools.",
      benefits: readSubscriptionBenefits(item.benefits),
      comparisonBenefits: readComparisonBenefits(item.comparisonBenefits),
      buttonLabel: item.buttonLabel ?? "Subscribe",
      skipLabel: item.skipLabel ?? "Skip for later",
      theme: item.theme && subscriptionPlanThemes.includes(item.theme) ? item.theme : subscriptionPlanThemes[index % subscriptionPlanThemes.length],
      features: Array.isArray(item.features) ? item.features.map(String) : [],
      moreFeatures: item.moreFeatures,
    });
  });

  return normalizedPlans;
}

function readSubscriptionBenefits(value: unknown): SubscriptionBenefit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const benefit = item as { title?: unknown; description?: unknown };
    const title = String(benefit.title ?? "").trim();
    const description = String(benefit.description ?? "").trim();

    return title ? [{ title, description }] : [];
  });
}

function readComparisonBenefits(value: unknown): ComparisonBenefitRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const row = item as { benefit?: unknown; free?: unknown; scorecarePro?: unknown };
    const benefit = String(row.benefit ?? "").trim();

    if (!benefit) {
      return [];
    }

    return [{
      benefit,
      free: readComparisonValue(row.free),
      scorecarePro: readComparisonValue(row.scorecarePro),
    }];
  });
}

function readComparisonValue(value: unknown): ComparisonBenefitValue {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value ?? "").trim();
}

export function formatPlanAmount(plan: SubscriptionPlan) {
  if (plan.currency === "INR" || !plan.currency) {
    return `₹${plan.amount}`;
  }

  return `${plan.currency} ${plan.amount}`;
}

function calculatePlanPayableAmount(plan: Partial<SubscriptionPlan>, fallback: SubscriptionPlan) {
  const amount = Number(plan.amount ?? fallback.amount);
  const gstPercentage = Number(plan.gstPercentage ?? fallback.gstPercentage ?? 0);
  const payableAmount = amount + (amount * gstPercentage) / 100;

  return Math.round(payableAmount * 100) / 100;
}

function calculatePlanGstAmount(plan: Partial<SubscriptionPlan>, fallback: SubscriptionPlan) {
  const amount = Number(plan.amount ?? fallback.amount);
  const gstPercentage = Number(plan.gstPercentage ?? fallback.gstPercentage ?? 0);

  return Math.round(((amount * gstPercentage) / 100) * 100) / 100;
}

function toRazorpayAmount(amount: number) {
  return Math.round(amount * 100);
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

function clearSubscriptionPaymentCache() {
  localStorage.removeItem("subscriptionStatus");
  localStorage.removeItem("dashboardData");
  sessionStorage.removeItem("subscriptionStatus");
  sessionStorage.removeItem("dashboardData");
  sessionStorage.removeItem("scorecare_subscription_success_reloaded");
  clearCachedCibilDisplayData();
}

async function fetchSubscriptionStatus(token: string) {
  const response = await apiRequest("/api/subscription-plans/status", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Unable to load subscription status.");
  }

  return response.json();
}

export function formatBillingCycle(billingCycle?: string) {
  const cycle = billingCycle?.toLowerCase();

  if (cycle === "yearly" || cycle === "annual" || cycle === "annually") {
    return "/yr";
  }

  if (cycle === "monthly" || cycle === "month") {
    return "/mo";
  }

  return cycle ? `/${cycle}` : "/mo";
}
