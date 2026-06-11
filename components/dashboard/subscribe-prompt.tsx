"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { apiRequest } from "@/lib/api";

type SubscriptionPlan = {
  id: string;
  publicId?: string | null;
  planName: string;
  amount: number;
  currency: string;
  offerTag?: string | null;
  recommendedFor?: string | null;
};

type SubscriptionPlansResponse = {
  status?: string;
  data?: {
    plans?: SubscriptionPlan[] | null;
  } | null;
};

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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [plansError, setPlansError] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    if (!show || plans.length) {
      return;
    }

    let active = true;

    async function loadPlans() {
      setPlansError("");
      setPlansLoading(true);

      try {
        const response = await apiRequest("/subscription-plans", {
          method: "GET",
        });
        const result = (await response.json()) as SubscriptionPlansResponse;
        const apiPlans = Array.isArray(result?.data?.plans) ? result.data.plans : [];

        if (!response.ok || result?.status === "error" || !apiPlans.length) {
          throw new Error("Unable to load subscription plans.");
        }

        if (active) {
          setPlans(apiPlans);
          setSelectedPlanId(apiPlans[0]?.publicId || apiPlans[0]?.id || null);
        }
      } catch {
        if (active) {
          setPlansError("Could not load subscription plans. Please try again.");
        }
      } finally {
        if (active) {
          setPlansLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      active = false;
    };
  }, [plans.length, show]);

  function closePrompt(event: MouseEvent) {
    event.stopPropagation();
    onClose();
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
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_80%_0%,rgba(94,242,194,0.18),transparent_34%),linear-gradient(180deg,#151E2A_0%,#0D131C_100%)]" />
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 sm:px-6">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-white/16" />
              <div className="relative mx-auto mt-5 flex max-w-md items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[#FFD34D]">Subscribe</p>
                  <h2 className="mt-2 text-[21px] font-semibold leading-7 text-white">Unlock premium features</h2>
                  <p className="mt-2 text-[12px] font-medium leading-5 text-[#AAB6C8]">Choose a plan to continue using reports, health insights, and predictor tools.</p>
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

              <div className="relative mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 pb-4">
                {plansLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="min-h-[5.5rem] animate-pulse rounded-[22px] bg-white/[0.06] px-3 py-3">
                      <div className="h-3 w-16 rounded-full bg-white/12" />
                      <div className="mt-4 h-5 w-20 rounded-full bg-white/12" />
                    </div>
                  ))
                ) : null}

                {!plansLoading && plansError ? (
                  <div className="col-span-2 rounded-2xl bg-[#FF5C8A]/12 px-4 py-3 text-xs font-medium leading-5 text-[#FF8BAA]">
                    {plansError}
                  </div>
                ) : null}

                {!plansLoading && !plansError ? plans.map((plan) => {
                  const planId = plan.publicId || plan.id;
                  const selected = selectedPlanId === planId;

                  return (
                  <button
                    key={planId}
                    className={`relative min-h-[5.4rem] rounded-[22px] px-3 py-3 text-left shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition ${
                      selected
                        ? "bg-[linear-gradient(145deg,rgba(94,242,194,0.2),rgba(21,30,42,0.96))] text-white ring-1 ring-[#5EF2C2]/70"
                        : "bg-[#151E2A] text-white hover:bg-[#1A2634]"
                    }`}
                    onClick={() => setSelectedPlanId(planId)}
                    type="button"
                  >
                    {plan.offerTag ? (
                      <span className="absolute right-2 top-2 max-w-[4.5rem] truncate rounded-full bg-[#FF7A00]/16 px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-none text-[#FFD34D]">
                        {plan.offerTag}
                      </span>
                    ) : null}
                    <span className="block pr-[4.75rem] text-[13px] font-semibold leading-5">{plan.planName}</span>
                    <span className="mt-1 block text-[18px] font-semibold text-[#FFD34D]">{formatPlanAmount(plan.amount, plan.currency)}</span>
                    {plan.recommendedFor ? <span className="mt-1 block text-[11px] font-medium leading-4 text-[#AAB6C8]">{plan.recommendedFor}</span> : null}
                  </button>
                  );
                }) : null}
              </div>
            </div>

            <div className="relative border-t border-white/8 bg-[#0D131C] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
              <button
                className="mx-auto block h-[3.25rem] w-full max-w-md rounded-2xl bg-[linear-gradient(135deg,#FF7A00,#FFD34D)] text-sm font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)] transition disabled:opacity-60"
                disabled={!selectedPlanId || plansLoading}
                type="button"
              >
                Subscribe
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return typeof document === "undefined" ? null : createPortal(sheet, document.body);
}

function formatPlanAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      currency: currency || "INR",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(amount);
  } catch {
    return `${currency || "INR"} ${amount}`;
  }
}
