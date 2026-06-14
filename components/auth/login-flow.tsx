"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ClipboardEvent } from "react";
import panDetailsImage from "@/assets/pan-details.png";
import { ButtonLoader } from "@/components/auth/button-loader";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

type LegalPopup = "terms" | "privacy" | "consent";

type LegalContent = {
  termsAndConditions?: string;
  privacyPolicy?: string;
  consent?: string;
  updatedAt?: string;
};

type WebOtpCredential = Credential & {
  code?: string;
};

type WebOtpRequestOptions = CredentialRequestOptions & {
  otp: { transport: string[] };
};

export function LoginFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"mobile" | "otp" | "pan">("mobile");
  const [mobile, setMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [pan, setPan] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [consent, setConsent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [otpSeconds, setOtpSeconds] = useState(0);
  const [signupConsent, setSignupConsent] = useState(false);
  const [legalPopup, setLegalPopup] = useState<LegalPopup | null>(null);
  const [legalContent, setLegalContent] = useState<LegalContent | null>(null);
  const [isLoadingLegalContent, setIsLoadingLegalContent] = useState(false);
  const [legalContentError, setLegalContentError] = useState("");

  const cleanMobile = mobile.replace(/\D/g, "").slice(0, 10);
  const cleanOtp = otpDigits.join("");
  const cleanPan = pan.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const canProceed = cleanMobile.length === 10 && signupConsent;
  const canVerifyOtp = cleanOtp.length === 6;
  const canSubmit =
    /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan) &&
    name.trim().length > 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    Boolean(dateOfBirth) &&
    consent;

  const otpTimerText = `00:${String(otpSeconds).padStart(2, "0")}`;

  useEffect(() => {
    if (step !== "otp" || otpSeconds === 0) return;

    const timer = window.setTimeout(() => {
      setOtpSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpSeconds, step]);

  useEffect(() => {
    if (step !== "otp" || !("OTPCredential" in window) || !navigator.credentials) return;

    const abortController = new AbortController();

    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: abortController.signal,
      } as WebOtpRequestOptions)
      .then((credential) => {
        const otp = (credential as WebOtpCredential | null)?.code?.replace(/\D/g, "").slice(0, 6);

        if (otp?.length === 6) {
          setOtpDigits(otp.split(""));
          void verifyOtp(otp);
        }
      })
      .catch(() => {});

    return () => abortController.abort();
  }, [step]);

  function goToDashboard() {
    router.push("/dashboard");
  }

  async function sendOtp() {
    if (!canProceed || isSendingOtp) return;

    setOtpError("");
    setIsSendingOtp(true);

    try {
      const response = await apiRequest("/auth/send-otp", {
        method: "POST",
        body: { mobileNumber: cleanMobile },
      });

      if (!response.ok) throw new Error("Unable to send OTP");

      setOtpDigits(["", "", "", "", "", ""]);
      setOtpSeconds(45);
      setStep("otp");
    } catch {
      setOtpError("Could not send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function verifyOtp(otpValue = cleanOtp) {
    if (otpValue.length !== 6 || isVerifyingOtp) return;

    setOtpError("");
    setIsVerifyingOtp(true);

    try {
      const response = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: {
          mobileNumber: cleanMobile,
          otp: otpValue,
        },
      });

      if (!response.ok) throw new Error("Unable to verify OTP");

      const result = await response.json();
      const session = result?.data;

      if (session?.token) {
        sessionStorage.setItem("scorecare_token", session.token);
        sessionStorage.setItem("scorecare_token_type", session.tokenType ?? "Bearer");
        sessionStorage.setItem("scorecare_mobile_number", session.mobileNumber ?? cleanMobile);
      }

      if (session?.user) {
        sessionStorage.setItem("scorecare_mobile_number", session.user.mobileNumber ?? session.mobileNumber ?? cleanMobile);
        sessionStorage.setItem("scorecare_pan_number", session.user.panNumber ?? "");
        sessionStorage.setItem("scorecare_full_name", session.user.fullName ?? "");
        sessionStorage.setItem("scorecare_email", session.user.email ?? "");
        sessionStorage.setItem("scorecare_date_of_birth", session.user.dateOfBirth ?? "");
      }

      if (
        session?.nextStep === "dashboard" ||
        session?.profileComplete ||
        session?.shouldShowPanDetailsForm === false
      ) {
        goToDashboard();
        return;
      }

      setStep("pan");
    } catch {
      setOtpError("Invalid OTP. Please check and try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function updateProfile() {
    if (!canSubmit || isSavingProfile) return;

    const token = sessionStorage.getItem("scorecare_token");

    if (!token) {
      setProfileError("Session expired. Please verify OTP again.");
      setStep("otp");
      return;
    }

    setProfileError("");
    setIsSavingProfile(true);

    try {
      const response = await apiRequest("/users/me/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          panNumber: cleanPan,
          fullName: name.trim(),
          email: email.trim(),
          sendWelcomeMail: true,
          dateOfBirth,
        },
      });

      if (!response.ok) throw new Error("Unable to save profile");

      sessionStorage.setItem("scorecare_pan_number", cleanPan);
      sessionStorage.setItem("scorecare_full_name", name.trim());
      sessionStorage.setItem("scorecare_email", email.trim());
      sessionStorage.setItem("scorecare_date_of_birth", dateOfBirth);

      goToDashboard();
    } catch {
      setProfileError("Could not save PAN details. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function updateOtpDigit(index: number, value: string) {
    setOtpError("");
    const digits = value.replace(/\D/g, "").slice(0, 6).split("");

    if (digits.length > 1) {
      const nextDigits = [...otpDigits];

      digits.forEach((digit, offset) => {
        if (index + offset < nextDigits.length) {
          nextDigits[index + offset] = digit;
        }
      });

      setOtpDigits(nextDigits);
      document.getElementById(`otp-${Math.min(index + digits.length, 5)}`)?.focus();
      return;
    }

    const nextDigits = [...otpDigits];
    nextDigits[index] = digits[0] ?? "";
    setOtpDigits(nextDigits);

    if (digits[0] && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function handleOtpKeyDown(index: number, key: string) {
    if (key !== "Backspace" || otpDigits[index]) return;
    document.getElementById(`otp-${Math.max(index - 1, 0)}`)?.focus();
  }

  function handleOtpPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pastedOtp = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedOtp.length <= 1) return;

    event.preventDefault();
    updateOtpDigit(index, pastedOtp);
  }

  const primaryButton =
    "relative h-14 w-full rounded-[20px] text-[14px] font-semibold transition shadow-[0_14px_30px_rgba(34,242,194,0.18)]";

  const activeButton = "bg-[linear-gradient(135deg,#22F2C2,#18E870)] text-[#031711]";
  const disabledButton = "bg-[#263447] text-[#64748B] shadow-none";

  const inputClass =
    "mt-2.5 h-14 w-full rounded-2xl border border-white/10 bg-[#071626] px-4 text-[14px] font-medium text-white outline-none transition placeholder:font-normal placeholder:text-[#64748B] focus:border-[#22F2C2] focus:ring-2 focus:ring-[#22F2C2]/20";

  const labelClass =
    "text-[12px] font-semibold uppercase tracking-[0.14em] text-white";

  const legalMeta = {
    terms: {
      title: "Terms & Conditions",
      eyebrow: "ScoreCare Terms",
      key: "termsAndConditions",
    },
    privacy: {
      title: "Privacy Policy",
      eyebrow: "Data Privacy",
      key: "privacyPolicy",
    },
    consent: {
      title: "Credit Report Consent",
      eyebrow: "PAN Consent",
      key: "consent",
    },
  } satisfies Record<LegalPopup, { title: string; eyebrow: string; key: keyof LegalContent }>;

  const fetchLegalContent = useCallback(async () => {
    if (legalContent || isLoadingLegalContent) return;

    setLegalContentError("");
    setIsLoadingLegalContent(true);

    try {
      const response = await apiRequest("/legal-content");
      if (!response.ok) throw new Error("Unable to load legal content");

      const result = await response.json();
      if (!result?.data) throw new Error("Missing legal content");

      setLegalContent(result.data);
    } catch {
      setLegalContentError("Could not load legal content. Please try again.");
    } finally {
      setIsLoadingLegalContent(false);
    }
  }, [isLoadingLegalContent, legalContent]);

  const openLegalPopup = useCallback((type: LegalPopup) => {
    setLegalPopup(type);
    void fetchLegalContent();
  }, [fetchLegalContent]);

  const content = useMemo(() => {
    if (step === "pan") {
      return (
        <motion.div
          key="pan"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex min-h-dvh flex-col bg-[#020B18] px-5 py-5 text-white"
        >
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#183A5A_0%,transparent_38%),radial-gradient(circle_at_80%_10%,rgba(34,242,194,0.16),transparent_28%)]" />

          <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col">
            <button
              type="button"
              onClick={() => setStep("otp")}
              className="mb-6 grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_10px_25px_rgba(0,0,0,0.22)]"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </button>

            <div className="rounded-[28px] border border-white/10 bg-[#0F1B2D]/95 p-5 shadow-[0_22px_54px_rgba(0,0,0,0.42)]">
              <div className="mb-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#22F2C2]">
                  Secure profile
                </p>
                <h1 className="mt-2 text-[1.4rem] font-bold leading-tight tracking-tight text-white">
                  Enter your PAN details
                </h1>
                <p className="mt-2 text-[13px] font-medium leading-6 text-[#8F9BAA]">
                  This helps us fetch your credit insights securely.
                </p>
              </div>

              <div className="grid gap-4">
                <label className={labelClass}>
                  PAN number
                  <input
                    value={cleanPan}
                    onChange={(event) => {
                      setProfileError("");
                      setPan(event.target.value);
                    }}
                    className={cn(inputClass, "uppercase")}
                    placeholder="ABCDE1234F"
                    inputMode="text"
                  />
                </label>

                <div className="flex items-center gap-2 rounded-2xl border border-[#22F2C2]/15 bg-[#22F2C2]/8 px-3 py-3 text-xs font-medium leading-5 text-[#B8FFF0]">
                  <BadgeCheck className="size-4 shrink-0 text-[#22F2C2]" />
                  PAN is used only to fetch your credit report securely.
                </div>

                <label className={labelClass}>
                  Full name <span className="tracking-normal text-white">(as per PAN)</span>
                  <input
                    value={name}
                    onChange={(event) => {
                      setProfileError("");
                      setName(event.target.value);
                    }}
                    className={inputClass}
                    placeholder="Your name as per PAN"
                  />
                </label>

                <label className={labelClass}>
                  Email address
                  <input
                    value={email}
                    onChange={(event) => {
                      setProfileError("");
                      setEmail(event.target.value);
                    }}
                    className={inputClass}
                    placeholder="rahul@example.com"
                    inputMode="email"
                    type="email"
                  />
                </label>

                <label className={labelClass}>
                  Date of birth
                  <input
                    value={dateOfBirth}
                    onChange={(event) => {
                      setProfileError("");
                      setDateOfBirth(event.target.value);
                    }}
                    className={cn(inputClass, "scheme-dark")}
                    type="date"
                     max={new Date().toISOString().split("T")[0]}
                  />
                </label>

                <label className="flex gap-3 text-[14px] font-medium leading-6 text-white">
                  <input
                    checked={consent}
                    onChange={(event) => {
                      setProfileError("");
                      setConsent(event.target.checked);
                    }}
                    type="checkbox"
                    className="mt-1 size-5 rounded border-white/20 bg-[#071626] accent-[#22F2C2]"
                  />
                  <span>
                  I consent to Scorecare accessing my credit report.{" "}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        openLegalPopup("consent");
                      }}
                      className="font-semibold text-[#22F2C2] underline underline-offset-4"
                    >
                      Read more
                    </button>
                  </span>
                </label>

                <div className="mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[#071626]">
                  <Image
                    src={panDetailsImage}
                    alt="Where to find PAN details"
                    className="h-auto w-full opacity-90"
                    priority
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!canSubmit || isSavingProfile}
              onClick={updateProfile}
              className={cn(
                primaryButton,
                "mt-5",
                canSubmit && !isSavingProfile ? activeButton : disabledButton,
              )}
            >
              {isSavingProfile ? (
                <>
                  <span className="invisible">Submit</span>
                  <ButtonLoader className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </>
              ) : (
                "Submit"
              )}
            </button>

            {profileError ? (
              <p className="mt-3 text-center text-sm font-semibold text-[#FF5C8A]">
                {profileError}
              </p>
            ) : null}
          </div>
        </motion.div>
      );
    }

    if (step === "otp") {
      return (
        <motion.div
          key="otp"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex min-h-dvh flex-col bg-[#020B18] px-5 py-5 text-white"
        >
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#183A5A_0%,transparent_38%),radial-gradient(circle_at_80%_10%,rgba(34,242,194,0.16),transparent_28%)]" />

          <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col">
            <button
              type="button"
              onClick={() => setStep("mobile")}
              className="mb-6 grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white shadow-[0_10px_25px_rgba(0,0,0,0.22)]"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </button>

           <div className="rounded-[28px] border border-white/10 bg-[#0F1B2D]/95 p-5 shadow-[0_22px_54px_rgba(0,0,0,0.42)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#22F2C2]">
                Verification
              </p>

              <h1 className="mt-2 max-w-sm text-[1.6rem] font-bold leading-tight tracking-tight text-white">
                Enter OTP
              </h1>

              <p className="mt-3 text-[15px] font-medium leading-6 text-white">
                We sent a verification code to{" "}
                <span className="font-bold text-[#22F2C2]">
                  +91 {cleanMobile}
                </span>
                .
              </p>

              <div className="mt-9 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8F9BAA]">
                Verification code
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      value={digit}
                      onChange={(event) => updateOtpDigit(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event.key)}
                      onPaste={(event) => handleOtpPaste(index, event)}
                      className="aspect-square w-full rounded-2xl border border-white/10 bg-[#071626] text-center text-[20px] font-semibold text-white outline-none transition placeholder:text-[#64748B] focus:border-[#22F2C2] focus:ring-2 focus:ring-[#22F2C2]/20"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      enterKeyHint="done"
                      inputMode="numeric"
                      name={index === 0 ? "one-time-code" : `otp-${index + 1}`}
                      pattern="[0-9]*"
                      type="tel"
                      maxLength={1}
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={cn(
                  "mt-5 text-base font-semibold transition",
                  otpSeconds === 0 && !isSendingOtp ? "text-[#22F2C2]" : "text-[#64748B]",
                )}
                disabled={isSendingOtp || otpSeconds > 0}
                onClick={sendOtp}
              >
                {isSendingOtp ? "Sending..." : "Resend OTP"}
              </button>

              {otpSeconds > 0 ? (
                <p className="mt-2 text-[15px] font-medium text-[#8F9BAA]">
                  Resend available in {otpTimerText}
                </p>
              ) : null}

              {otpError ? (
                <p className="mt-3 text-sm font-semibold text-[#FF5C8A]">{otpError}</p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={!canVerifyOtp || isVerifyingOtp}
              onClick={() => verifyOtp()}
              className={cn(
                primaryButton,
                "mt-5",
                canVerifyOtp && !isVerifyingOtp ? activeButton : disabledButton,
              )}
            >
              {isVerifyingOtp ? (
                <>
                  <span className="invisible">Verify</span>
                  <ButtonLoader className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="mobile"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex min-h-dvh flex-col bg-[#020B18] px-5 py-5 text-white"
      >
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#183A5A_0%,transparent_38%),radial-gradient(circle_at_80%_10%,rgba(34,242,194,0.16),transparent_28%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col">
          <div className="pt-7">
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 shadow-[0_10px_25px_rgba(0,0,0,0.22)]">
              <ShieldCheck className="size-4 text-[#22F2C2]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#B8FFF0]">
                ScoreCare
              </span>
            </div> */}

            <h1 className="mt-7 max-w-sm text-[1.75rem] font-bold leading-tight tracking-tight text-white">
              Enter your mobile number
            </h1>

            <p className="mt-3 text-[13px] font-medium leading-6 text-[#8F9BAA]">
              Track your score, reports, offers and EMIs in one secure place.
            </p>
          </div>

          <div className="mt-9 rounded-[28px] border border-white/10 bg-[#0F1B2D]/95 p-5 shadow-[0_22px_54px_rgba(0,0,0,0.42)]">
            <label className="flex h-14 items-center rounded-2xl border border-white/10 bg-[#071626] px-4 transition focus-within:border-[#22F2C2] focus-within:ring-2 focus-within:ring-[#22F2C2]/20">
              <span className="border-r border-white/10 pr-3 text-base font-semibold text-[#22F2C2]">
                +91
              </span>
              <input
                value={cleanMobile}
                onChange={(event) => setMobile(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 text-base font-medium text-white outline-none placeholder:text-[#64748B]"
                placeholder="Mobile number"
                inputMode="numeric"
                type="tel"
                suppressHydrationWarning
              />
            </label>

            <p className="mt-4 text-[13px] font-medium leading-6 text-[#8F9BAA]">
              We do not spam you with calls or messages.
            </p>

            <label className="mt-4 flex gap-3 text-[13px] font-medium leading-6 text-[#8F9BAA]">
              <input
                checked={signupConsent}
                onChange={(event) => setSignupConsent(event.target.checked)}
                type="checkbox"
                className="mt-1 size-5 rounded border-white/20 bg-[#071626] accent-[#22F2C2]"
              />
              <span>
                By signing up, I agree to the{" "}
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    openLegalPopup("terms");
                  }}
                  className="font-semibold text-[#22F2C2] underline underline-offset-4"
                >
                  T&C
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    openLegalPopup("privacy");
                  }}
                  className="font-semibold text-[#22F2C2] underline underline-offset-4"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>
          </div>

          <div className="mt-auto pb-2 pt-6">
            <button
              type="button"
              disabled={!canProceed || isSendingOtp}
              onClick={sendOtp}
              className={cn(primaryButton, canProceed && !isSendingOtp ? activeButton : disabledButton)}
            >
              {isSendingOtp ? (
                <>
                  <span className="invisible">Proceed</span>
                  <ButtonLoader className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </>
              ) : (
                "Proceed"
              )}
            </button>

            {otpError ? (
              <p className="mt-3 text-center text-sm font-semibold text-[#FF5C8A]">
                {otpError}
              </p>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }, [
    canProceed,
    canSubmit,
    canVerifyOtp,
    cleanMobile,
    cleanOtp,
    cleanPan,
    consent,
    dateOfBirth,
    email,
    isSendingOtp,
    isSavingProfile,
    isVerifyingOtp,
    name,
    openLegalPopup,
    otpDigits,
    otpError,
    otpSeconds,
    otpTimerText,
    profileError,
    step,
  ]);

  return (
    <>
      <AnimatePresence mode="wait">{content}</AnimatePresence>
      <AnimatePresence>
        {legalPopup ? (
          <motion.div
            className="fixed inset-0 z-50 flex bg-[#020B18]/90 p-3 backdrop-blur-md sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0F1B2D] text-white shadow-[0_24px_70px_rgba(0,0,0,0.48)]"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="legal-popup-title"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,242,194,0.2),transparent_32%),radial-gradient(circle_at_12%_0%,rgba(24,58,90,0.65),transparent_36%)]" />

              <div className="relative border-b border-white/10 px-5 py-5 sm:px-8 sm:py-7">
                <div className="flex items-start justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#22F2C2]">
                      {legalMeta[legalPopup].eyebrow}
                    </p>
                    <h2
                      id="legal-popup-title"
                      className="mt-2 text-[1.7rem] font-bold leading-tight text-white sm:text-[2.2rem]"
                    >
                      {legalMeta[legalPopup].title}
                    </h2>
                    {/* <p className="mt-3 text-[13px] font-medium leading-6 text-[#AAB6C8] sm:text-sm">
                      Please review the details below before continuing with ScoreCare.
                    </p> */}
                  </div>

                  <button
                    type="button"
                    onClick={() => setLegalPopup(null)}
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#B8FFF0]"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
                {isLoadingLegalContent ? (
                  <div className="grid min-h-64 place-items-center rounded-[24px] border border-white/10 bg-[#071626]/92 p-6 text-center text-sm font-semibold text-[#AAB6C8]">
                    Loading legal content...
                  </div>
                ) : legalContentError ? (
                  <div className="grid min-h-64 place-items-center rounded-[24px] border border-white/10 bg-[#071626]/92 p-6 text-center">
                    <div>
                      <p className="text-sm font-semibold text-[#FF5C8A]">{legalContentError}</p>
                      <button
                        type="button"
                        onClick={fetchLegalContent}
                        className="mt-4 text-sm font-semibold text-[#22F2C2] underline underline-offset-4"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-[24px] border border-white/10 bg-[#071626]/92 p-5 text-[13px] font-medium leading-7 text-[#AAB6C8] shadow-[0_14px_32px_rgba(0,0,0,0.2)] sm:p-7 sm:text-sm [&_a]:font-semibold [&_a]:text-[#22F2C2] [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_li]:mb-2 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:text-white [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{
                      __html: legalContent?.[legalMeta[legalPopup].key] ?? "",
                    }}
                  />
                )}
                {legalContent?.updatedAt ? (
                  <p className="mt-4 text-xs font-medium text-[#64748B]">
                    Last updated:{" "}
                    {new Date(legalContent.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>

              <div className="relative border-t border-white/10 bg-[#071626]/80 p-4 sm:px-8">
                <button
                  type="button"
                  onClick={() => setLegalPopup(null)}
                  className={cn(primaryButton, activeButton)}
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
