"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const plans = [
  { label: "Monthly", amount: "Rs. 89", recommended: false },
  { label: "3 Months", amount: "Rs. 199", recommended: true },
  { label: "6 Months", amount: "Rs. 399", recommended: false },
  { label: "Year", amount: "Rs. 699", recommended: false },
] as const;

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
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number]["label"]>("Monthly");

  function closePrompt(event: MouseEvent) {
    event.stopPropagation();
    onClose();
  }

  const sheet: ReactNode = (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end bg-slate-950/55 px-2 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closePrompt}
        >
          <motion.div
            className="relative flex max-h-[calc(100dvh-5rem)] min-h-[25rem] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.28)] sm:mx-auto sm:max-w-md sm:rounded-[2rem]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,#f4f9ff_0%,#ffffff_100%)]" />
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 sm:px-6">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="relative mx-auto mt-5 flex max-w-md items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--portal-orange)]">Subscribe</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--portal-ink)]">Unlock premium features</h2>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[var(--portal-muted)]">Choose a plan to continue using reports, health insights, and predictor tools.</p>
                </div>
                <button
                  aria-label="Close subscription prompt"
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  onClick={closePrompt}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="relative mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 pb-4">
                {plans.map((plan) => (
                  <button
                    key={plan.label}
                    className={`relative min-h-[4.5rem] rounded-2xl border px-3 py-3 text-left shadow-sm transition ${
                      selectedPlan === plan.label
                        ? "border-[var(--portal-blue)] bg-[var(--portal-blue-soft)] text-[var(--portal-blue)] shadow-[0_10px_24px_rgba(22,119,255,0.12)]"
                        : "border-[var(--portal-border)] bg-white text-[var(--portal-ink)] hover:border-[var(--portal-blue)] hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedPlan(plan.label)}
                    type="button"
                  >
                    {plan.recommended ? (
                      <span className="absolute right-2 top-2 rounded-full bg-[var(--portal-orange-soft)] px-2 py-0.5 text-[0.56rem] font-black uppercase tracking-[0.08em] text-[var(--portal-orange)]">
                        Recommended
                      </span>
                    ) : null}
                    <span className="block pr-20 text-sm font-black">{plan.label}</span>
                    <span className="mt-1 block text-lg font-black">{plan.amount}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative border-t border-slate-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
              <button
                className="mx-auto block h-[3.25rem] w-full max-w-md rounded-2xl bg-[var(--portal-orange)] text-sm font-black text-white shadow-[0_14px_28px_rgba(255,109,0,0.24)] transition hover:bg-[var(--portal-orange-deep)]"
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
