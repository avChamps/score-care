"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { getCachedCibilDisplayData } from "@/lib/cibil-display-cache";

export type SubscriptionPlan = {
  id: string;
  publicId?: string;
  planName: string;
  amount: number;
  billingCycle?: string;
  currency?: string;
  badge: string;
  icon: string;
  title?: string;
  subtitle?: string;
  description?: string;
  benefits: string[];
  buttonLabel?: string;
  skipLabel?: string;
  features: string[];
  moreFeatures?: string;
  theme: "blue" | "purple" | "green" | "orange" | "pink" | "cyan";
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

export function SubscribePromptOverlay({ onClose, show }: { onClose: () => void; show: boolean }) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState(subscriptionPlans[0].id);
  const [showPlans, setShowPlans] = useState(false);
  const [showSkipMessage, setShowSkipMessage] = useState(false);
  const [plans, setPlans] = useState(subscriptionPlans);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  const premiumBenefits = Array.from(new Set(plans.flatMap((plan) => (plan.benefits.length ? plan.benefits : plan.features)).filter(Boolean)));

  useEffect(() => {
    if (!show) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setShowPlans(false);
      setShowSkipMessage(false);
      setPaymentMessage("");
    }, 0);

    async function loadSubscriptionPlans() {
      try {
        const apiPlans = await getSubscriptionPlans();

        if (apiPlans.length) {
          setPlans(apiPlans);
          setSelectedPlanId(apiPlans[0].id);
        }
      } catch {
        setPlans(subscriptionPlans);
      }
    }

    void loadSubscriptionPlans();

    return () => window.clearTimeout(resetTimer);
  }, [show]);

  function closePrompt(event: MouseEvent) {
    event.stopPropagation();
    setShowSkipMessage(true);
  }

  function closeAll(event: MouseEvent) {
    event.stopPropagation();
    setShowSkipMessage(false);
    onClose();
  }

  async function handleSubscriptionPayment() {
    if (!selectedPlan || paymentLoading) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    const planPublicId = selectedPlan.publicId || selectedPlan.id;

    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      await loadRazorpayCheckout();

      const subscriptionResponse = await apiRequest(`/subscription-plans/${encodeURIComponent(planPublicId)}/razorpay-subscription`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: {
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
      const plan = data?.plan ?? selectedPlan;
      const prefill = await getRazorpayPrefill(token, data?.prefill);

      if (!subscriptionResponse.ok || !data?.keyId || !order?.id || !data?.customerId || data?.recurring !== "1" || !window.Razorpay) {
        throw new Error("Unable to create subscription.");
      }

      console.log("Razorpay Prefill", prefill);

      const checkout = new window.Razorpay({
        key: data.keyId,
        order_id: order.id,
        customer_id: data.customerId,
        recurring: data.recurring,
        name: "ScoreCare",
        description: plan.planName ?? selectedPlan.planName,
        prefill,
        handler: async (response: RazorpaySubscriptionResponse) => {
          try {
            const confirmResponse = await apiRequest("/subscription-plans/razorpay/confirm", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id ?? order?.id,
                razorpaySignature: response.razorpay_signature,
                amount: Number(plan.amount ?? selectedPlan.amount),
                currency: plan.currency ?? selectedPlan.currency ?? "INR",
              },
            });

            if (confirmResponse.status === 401 || confirmResponse.status === 403) {
              clearScorecareSession();
              router.replace("/login");
              return;
            }

            if (!confirmResponse.ok) {
              throw new Error("Unable to confirm subscription.");
            }

            onClose();
            void getCachedCibilDisplayData(token, { forceRefresh: true }).catch(() => {});
          } catch (error) {
            setPaymentMessage(error instanceof Error ? error.message : "Unable to confirm subscription.");
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

  const sheet: ReactNode = (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end bg-[#050910]/70 px-3 backdrop-blur-[5px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closePrompt}
        >
          <motion.div
            className="relative mx-auto flex max-h-[calc(100dvh-4rem)] min-h-[25rem] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-[#0D131C] text-white shadow-[0_-24px_80px_rgba(0,0,0,0.42)] sm:rounded-[2rem]"
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
                  <button className="mx-auto block h-[3.25rem] w-full max-w-md rounded-2xl bg-[linear-gradient(135deg,#FF7A00,#FFD34D)] text-sm font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)] transition disabled:opacity-60" disabled={!selectedPlanId || paymentLoading} type="button" onClick={handleSubscriptionPayment}>
                    {paymentLoading ? "Processing..." : selectedPlan.buttonLabel ?? "Subscribe"}
                  </button>
                  <button className="mx-auto mt-3 block text-xs font-semibold text-[#AAB6C8] transition hover:text-white" onClick={closePrompt} type="button">
                    {selectedPlan.skipLabel}
                  </button>
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="min-h-44 bg-[radial-gradient(circle_at_82%_0%,rgba(94,242,194,0.24),transparent_34%),linear-gradient(180deg,#1D2A3A_0%,#0D131C_100%)] px-5 py-6">
                  <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits" onClick={closePrompt}>
                    <X className="size-5" />
                  </button>
                  <div className="mt-10 max-w-[18rem]">
                    <p className="text-caption font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Premium Benefits</p>
                    <h2 className="mt-2 text-heading font-semibold leading-7 text-white">Unlock your complete credit dashboard</h2>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-4">
                  <div className="grid gap-3 text-body-sm font-medium leading-5 text-[#AAB6C8]">
                    {premiumBenefits.map((benefit) => (
                      <p key={benefit} className="rounded-2xl bg-white/[0.06] px-4 py-3">{benefit}</p>
                    ))}
                  </div>

                  <button className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-body font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)]" type="button" onClick={() => setShowPlans(true)}>
                    Subscription
                  </button>
                  <button className="mx-auto mt-3 block text-caption font-medium text-[#6F7B8E]" type="button" onClick={closePrompt}>
                    skip for later
                  </button>
                </div>
              </div>
            )}
            {showSkipMessage ? (
              <div className="absolute inset-0 z-10 flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm" onClick={closeAll}>
                <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]" onClick={(event) => event.stopPropagation()}>
                  <div className="min-h-44 bg-[radial-gradient(circle_at_82%_0%,rgba(94,242,194,0.24),transparent_34%),linear-gradient(180deg,#1D2A3A_0%,#0D131C_100%)] px-5 py-6">
                    <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close subscription message" onClick={closeAll}>
                      <X className="size-5" />
                    </button>
                    <div className="mt-10 max-w-[18rem]">
                      <p className="text-caption font-semibold uppercase tracking-[3px] text-[#5EF2C2]">{selectedPlan.subtitle}</p>
                      <h2 className="mt-2 text-heading font-semibold leading-7 text-white">{selectedPlan.title}</h2>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-4">
                    <div className="grid gap-3 text-body-sm font-medium leading-5 text-[#AAB6C8]">
                      {premiumBenefits.map((benefit) => (
                        <p key={benefit} className="rounded-2xl bg-white/[0.06] px-4 py-3">{benefit}</p>
                      ))}
                    </div>

                    <button className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-body font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)]" type="button" onClick={closeAll}>
                      {selectedPlan.skipLabel}
                    </button>
                  </div>
                </section>
              </div>
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
      className={`overflow-hidden rounded-[26px] bg-[#101E2E] text-left shadow-[0_18px_36px_rgba(0,0,0,0.28)] transition ${
        selected ? `ring-2 ${theme.selectedRing}` : "ring-1 ring-white/8"
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
        <p className="mt-4 text-[34px] font-black leading-none text-white">{formatPlanAmount(plan)}<span className="ml-1 text-caption font-bold text-white/76">{formatBillingCycle(plan.billingCycle)}</span></p>
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
    const item = plan as Partial<SubscriptionPlan> & { name?: string; offerTag?: string; price?: number; monthlyPrice?: number };
    const id = String(item.publicId ?? item.id ?? item.planName ?? item.name ?? index);
    const planName = String(item.planName ?? item.name ?? "");
    const amount = Number(item.amount ?? item.price ?? item.monthlyPrice ?? 0);

    if (!planName || !amount) {
      return;
    }

    normalizedPlans.push({
      id,
      publicId: item.publicId,
      planName,
      amount,
      billingCycle: item.billingCycle,
      currency: item.currency,
      badge: item.badge ?? item.offerTag ?? (index === 0 ? "Most Popular" : "Best Value"),
      icon: item.icon ?? (index === 0 ? "🚀" : "💎"),
      title: item.title ?? "Unlock premium features",
      subtitle: item.subtitle ?? "Subscribe",
      description: item.description ?? "Choose a plan to continue using reports, health insights, and predictor tools.",
      benefits: Array.isArray(item.benefits) ? item.benefits.map(String) : [],
      buttonLabel: item.buttonLabel ?? "Subscribe",
      skipLabel: item.skipLabel ?? "Skip for later",
      theme: item.theme && subscriptionPlanThemes.includes(item.theme) ? item.theme : subscriptionPlanThemes[index % subscriptionPlanThemes.length],
      features: Array.isArray(item.features) ? item.features.map(String) : [],
      moreFeatures: item.moreFeatures,
    });
  });

  return normalizedPlans;
}

function formatPlanAmount(plan: SubscriptionPlan) {
  if (plan.currency === "INR" || !plan.currency) {
    return `₹${plan.amount}`;
  }

  return `${plan.currency} ${plan.amount}`;
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

function formatBillingCycle(billingCycle?: string) {
  const cycle = billingCycle?.toLowerCase();

  if (cycle === "yearly" || cycle === "annual" || cycle === "annually") {
    return "/yr";
  }

  if (cycle === "monthly" || cycle === "month") {
    return "/mo";
  }

  return cycle ? `/${cycle}` : "/mo";
}
