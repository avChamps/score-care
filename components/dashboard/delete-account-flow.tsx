"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type DeleteAccountFlowProps = {
  mobileNumber?: string;
  onClose: () => void;
  onDone: () => void;
};

const OTP_LENGTH = 6;

export function DeleteAccountFlow({ mobileNumber, onClose, onDone }: DeleteAccountFlowProps) {
  const [step, setStep] = useState<"warning" | "verify" | "done">("warning");
  const [accepted, setAccepted] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LENGTH }, () => ""));
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = otpDigits.join("");
  const formattedMobile = formatMobile(mobileNumber);

  const timerText = useMemo(() => `0:${String(seconds).padStart(2, "0")}`, [seconds]);

  useEffect(() => {
    if (step !== "verify" || seconds === 0) return;

    const timer = window.setTimeout(() => setSeconds((current) => Math.max(current - 1, 0)), 1000);

    return () => window.clearTimeout(timer);
  }, [seconds, step]);

  useEffect(() => {
    if (step !== "verify") return;

    const focusTimer = window.setTimeout(() => inputRefs.current[0]?.focus(), 250);

    return () => window.clearTimeout(focusTimer);
  }, [step]);

  async function sendDeletionOtp() {
    if (loading) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      onDone();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/users/me/delete-otp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to send verification code.");
      }

      setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      setSeconds(30);
      setStep("verify");
    } catch {
      setError("Unable to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndDeleteAccount() {
    if (otp.length !== OTP_LENGTH || loading) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      onDone();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/users/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          otp,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to delete account.");
      }

      clearScorecareSession();
      setStep("done");
    } catch {
      setError("Invalid code or unable to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function updateOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);
    setError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, key: string) {
    if (key !== "Backspace" || otpDigits[index] || index === 0) return;

    inputRefs.current[index - 1]?.focus();
  }

  if (step === "done") {
    return (
      <DeleteAccountFrame>
        <div className="flex min-h-[calc(100dvh-var(--native-status-offset,0px)-7rem-env(safe-area-inset-bottom,0px))] flex-col items-center justify-center px-8 text-center">
          <div className="grid size-[72px] place-items-center rounded-full bg-[#0E695C] text-[#32D8CA]">
            <span className="grid size-9 place-items-center rounded-full border-2 border-current">
              <Check className="size-5" strokeWidth={2.4} />
            </span>
          </div>
          <h2 className="mt-7 text-xl font-extrabold text-white">Account Deleted</h2>
          <p className="mt-4 max-w-[290px] text-sm font-medium leading-6 text-[#9DB1D8]">
            Your ScoreCare account and personal data have been deleted. Some records may be retained for up to 90 days as required by law, after which they are permanently purged.
          </p>
          <button
            type="button"
            className="mt-9 h-12 rounded-xl bg-[#32D8CA] px-7 text-sm font-extrabold text-[#061A20]"
            onClick={onDone}
          >
            Done
          </button>
        </div>
      </DeleteAccountFrame>
    );
  }

  return (
    <DeleteAccountFrame>
      <header className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl bg-white/[0.04] text-white"
          aria-label="Back"
          onClick={step === "verify" ? () => setStep("warning") : onClose}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="text-lg font-extrabold text-white">{step === "verify" ? "Verify It's You" : "Delete Account"}</h2>
      </header>

      {step === "warning" ? (
        <div className="flex min-h-[calc(100dvh-var(--native-status-offset,0px)-11rem-env(safe-area-inset-bottom,0px))] flex-col px-5 py-5">
          <div className="flex gap-3 rounded-2xl border border-[#803A3A] bg-[#491B1D] px-4 py-4 text-sm font-semibold leading-6 text-white">
            <AlertTriangle className="mt-1 size-5 shrink-0 text-[#FF6B6B]" />
            <p>This action is permanent. Once your account is deleted, it cannot be recovered.</p>
          </div>

          <p className="mt-6 text-sm font-extrabold uppercase text-[#8FA8D4]">What you&apos;ll lose</p>
          <ul className="mt-3 space-y-3 text-sm font-semibold leading-6 text-white">
            {[
              "Your credit score history and trend data will be permanently erased",
              "Any active disputes with Experian or CRIF High Mark will be closed and cannot be resumed",
              "Saved loan and credit card offers will no longer be accessible",
              "Your KYC and identity verification records will be deleted per DPDP Act, 2023",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 size-1.5 rounded-full bg-[#FF6B6B]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 rounded-2xl border border-[#263854] bg-[#172237] px-4 py-4 text-sm font-medium leading-6 text-[#94A8D2]">
            Some records may be retained for up to 90 days as required under RBI and GST regulations, after which they are permanently purged. See our Data Deletion Policy for details.
          </p>

          <label className="mt-6 flex gap-3 text-sm font-semibold leading-5 text-white">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 size-4 accent-[#32D8CA]"
            />
            I understand this action is permanent and I want to delete my ScoreCare account.
          </label>

          {error ? <p className="mt-4 rounded-xl bg-[#491B1D] px-4 py-3 text-sm font-semibold text-[#FF8A8A]">{error}</p> : null}

          <button
            type="button"
            disabled={!accepted || loading}
            className={cn(
              "mt-6 h-[52px] rounded-2xl text-sm font-extrabold transition",
              accepted && !loading ? "bg-[#32D8CA] text-[#061A20]" : "bg-[#18233A] text-[#8FA8D4]"
            )}
            onClick={() => void sendDeletionOtp()}
          >
            {loading ? "Sending Verification..." : "Continue to Verification"}
          </button>
        </div>
      ) : (
        <div className="flex min-h-[calc(100dvh-var(--native-status-offset,0px)-11rem-env(safe-area-inset-bottom,0px))] flex-col items-center px-5 py-10 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-[#0E695C] text-[#32D8CA]">
            <ShieldCheck className="size-7" />
          </div>
          <h3 className="mt-6 text-base font-extrabold text-white">Enter the code sent to</h3>
          <p className="mt-2 text-sm font-medium text-[#9DB1D8]">{formattedMobile}</p>

          <div className="mt-8 grid w-full max-w-[336px] grid-cols-6 gap-2">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Verification code digit ${index + 1}`}
                className="aspect-square w-full rounded-xl border border-[#2A3A58] bg-[#18233A] text-center text-xl font-extrabold text-white outline-none focus:border-[#32D8CA]"
                onChange={(event) => updateOtpDigit(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event.key)}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={seconds > 0 || loading}
            className="mt-7 text-sm font-semibold text-[#32D8CA] disabled:text-[#64748B]"
            onClick={() => void sendDeletionOtp()}
          >
            {seconds > 0 ? `Resend code in ${timerText}` : "Resend code"}
          </button>

          {error ? <p className="mt-4 rounded-xl bg-[#491B1D] px-4 py-3 text-sm font-semibold text-[#FF8A8A]">{error}</p> : null}

          <button
            type="button"
            disabled={otp.length !== OTP_LENGTH || loading}
            className={cn(
              "mt-auto h-[52px] w-full rounded-2xl text-sm font-extrabold transition",
              otp.length === OTP_LENGTH && !loading ? "bg-[#32D8CA] text-[#061A20]" : "bg-[#18233A] text-[#8FA8D4]"
            )}
            onClick={() => void verifyAndDeleteAccount()}
          >
            {loading ? "Deleting Account..." : "Verify & Delete Account"}
          </button>
        </div>
      )}
    </DeleteAccountFrame>
  );
}

function DeleteAccountFrame({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#020711] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(var(--native-status-offset,0px)+1rem)] [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <div className="mx-auto min-h-[calc(100dvh-var(--native-status-offset,0px)-2rem-env(safe-area-inset-bottom,0px))] max-w-md overflow-hidden rounded-[30px] bg-[#0A1222] shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
        {children}
      </div>
    </div>
  );
}

function formatMobile(value?: string) {
  const digits = value?.replace(/\D/g, "").slice(-10);

  if (!digits) {
    return "your registered mobile number";
  }

  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
