"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import panDetailsImage from "@/assets/pan-details.png";
import { ButtonLoader } from "@/components/auth/button-loader";
import { ScorecareBrandAnimation } from "@/components/auth/scorecare-brand-animation";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  const [showDashboardTransition, setShowDashboardTransition] = useState(false);
  const [otpSeconds, setOtpSeconds] = useState(0);

  const cleanMobile = mobile.replace(/\D/g, "").slice(0, 10);
  const cleanOtp = otpDigits.join("");
  const cleanPan = pan.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const canProceed = cleanMobile.length === 10;
  const canVerifyOtp = cleanOtp.length === 6;
  const canSubmit =
    /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan) &&
    name.trim().length > 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    Boolean(dateOfBirth) &&
    consent;
  const otpTimerText = `00:${String(otpSeconds).padStart(2, "0")}`;

  useEffect(() => {
    if (step !== "otp" || otpSeconds === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setOtpSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpSeconds, step]);

  function goToDashboardWithAnimation() {
    setShowDashboardTransition(true);
    window.setTimeout(() => {
      router.push("/dashboard");
    }, 5000);
  }

  async function sendOtp() {
    if (!canProceed || isSendingOtp) {
      return;
    }

    setOtpError("");
    setIsSendingOtp(true);

    try {
      const response = await apiRequest("/auth/send-otp", {
        method: "POST",
        body: {
          mobileNumber: cleanMobile,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to send OTP");
      }

      setOtpDigits(["", "", "", "", "", ""]);
      setOtpSeconds(45);
      setStep("otp");
    } catch {
      setOtpError("Could not send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function verifyOtp() {
    if (!canVerifyOtp || isVerifyingOtp) {
      return;
    }

    setOtpError("");
    setIsVerifyingOtp(true);

    try {
      const response = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: {
          mobileNumber: cleanMobile,
          otp: cleanOtp,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to verify OTP");
      }

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

      if (session?.nextStep === "dashboard" || session?.profileComplete || session?.shouldShowPanDetailsForm === false) {
        goToDashboardWithAnimation();
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
    if (!canSubmit || isSavingProfile) {
      return;
    }

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          panNumber: cleanPan,
          fullName: name.trim(),
          email: email.trim(),
          sendWelcomeMail: true,
          dateOfBirth,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to save profile");
      }

      sessionStorage.setItem("scorecare_pan_number", cleanPan);
      sessionStorage.setItem("scorecare_full_name", name.trim());
      sessionStorage.setItem("scorecare_email", email.trim());
      sessionStorage.setItem("scorecare_date_of_birth", dateOfBirth);
      goToDashboardWithAnimation();
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
    if (key !== "Backspace" || otpDigits[index]) {
      return;
    }

    document.getElementById(`otp-${Math.max(index - 1, 0)}`)?.focus();
  }

  const content = useMemo(() => {
    if (step === "pan") {
      return (
        <motion.div
          key="pan"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex min-h-[calc(100dvh-2.5rem)] flex-col"
        >
          <button
            type="button"
            onClick={() => setStep("otp")}
            className="mb-8 grid size-10 place-items-center rounded-full border border-[#e2e5ea] text-[#172033]"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-[1.7rem] font-black tracking-tight text-[#172033]">Enter your PAN details</h1>

            <div className="mt-10 grid gap-5">
              <label className="text-base font-bold text-[#5f6878]">
                PAN number
                <input
                  value={cleanPan}
                  onChange={(event) => {
                    setProfileError("");
                    setPan(event.target.value);
                  }}
                  className="mt-2.5 h-14 w-full rounded-xl border border-[#cfd6df] bg-white px-4 text-base font-bold uppercase text-[#172033] outline-none transition placeholder:font-medium placeholder:text-[#a6adb8] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                  placeholder="ABCDE1234F"
                  inputMode="text"
                />
              </label>

              <div className="flex items-center gap-2 text-sm font-semibold text-[#667085]">
                <BadgeCheck className="size-5 text-[#ff6d00]" />
                PAN is used only to fetch your credit report securely.
              </div>

              <label className="text-base font-bold text-[#5f6878]">
                Full name <span className="font-semibold text-[#98a2b3]">(as per PAN)</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setProfileError("");
                    setName(event.target.value);
                  }}
                  className="mt-2.5 h-14 w-full rounded-xl border border-[#cfd6df] bg-white px-4 text-base font-semibold text-[#172033] outline-none transition placeholder:font-medium placeholder:text-[#a6adb8] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                  placeholder="Your name as per PAN"
                />
              </label>

              <label className="text-base font-bold text-[#5f6878]">
                Email address
                <input
                  value={email}
                  onChange={(event) => {
                    setProfileError("");
                    setEmail(event.target.value);
                  }}
                  className="mt-2.5 h-14 w-full rounded-xl border border-[#cfd6df] bg-white px-4 text-base font-semibold text-[#172033] outline-none transition placeholder:font-medium placeholder:text-[#a6adb8] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                  placeholder="rahul@example.com"
                  inputMode="email"
                  type="email"
                />
              </label>

              <label className="text-base font-bold text-[#5f6878]">
                Date of birth
                <input
                  value={dateOfBirth}
                  onChange={(event) => {
                    setProfileError("");
                    setDateOfBirth(event.target.value);
                  }}
                  className="mt-2.5 h-14 w-full rounded-xl border border-[#cfd6df] bg-white px-4 text-base font-semibold text-[#172033] outline-none transition placeholder:text-[#a6adb8] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                  type="date"
                />
              </label>

              <label className="flex gap-3 text-base font-semibold leading-6 text-[#344054]">
                <input
                  checked={consent}
                  onChange={(event) => {
                    setProfileError("");
                    setConsent(event.target.checked);
                  }}
                  type="checkbox"
                  className="mt-1 size-5 rounded border-[#98a2b3]"
                />
                <span>
                  I consent to ScoreCare retrieving my credit report for analysis.{" "}
                  <Link href="/terms" className="font-black text-[#1677ff]">
                    Read more
                  </Link>
                </span>
              </label>

              <div className="mt-4 overflow-hidden rounded-2xl bg-[#f8fafc]">
                <Image
                  src={panDetailsImage}
                  alt="Where to find PAN details"
                  className="h-auto w-full"
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
              "relative mb-2 mt-8 inline-flex h-14 w-full items-center justify-center rounded-2xl text-base font-black text-white transition",
              canSubmit && !isSavingProfile ? "bg-[#ff6d00]" : "bg-[#98a2b3]",
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
          {profileError ? <p className="mb-2 text-center text-sm font-bold text-red-500">{profileError}</p> : null}
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
          className="flex min-h-[calc(100dvh-2.5rem)] flex-col"
        >
          <button
            type="button"
            onClick={() => setStep("mobile")}
            className="mb-8 grid size-10 place-items-center rounded-full border border-[#e2e5ea] text-[#172033]"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex-1 pt-8">
            <h1 className="max-w-sm text-[2rem] font-black leading-tight tracking-tight text-[#172033]">
              Enter OTP
            </h1>
            <p className="mt-4 text-base font-semibold leading-7 text-[#667085]">
              We sent a verification code to +91 {cleanMobile}.
            </p>

            <div className="mt-10 text-base font-bold text-[#5f6878]">
              Verification code
              <div className="mt-3 grid grid-cols-6 gap-2.5">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    value={digit}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event.key)}
                    className="aspect-square w-full rounded-xl border border-[#cfd6df] bg-white text-center text-xl font-black text-[#172033] outline-none transition focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                    inputMode="numeric"
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
                "mt-5 text-sm font-black transition",
                otpSeconds === 0 && !isSendingOtp ? "text-[#1677ff]" : "text-[#98a2b3]",
              )}
              disabled={isSendingOtp || otpSeconds > 0}
              onClick={sendOtp}
            >
              {isSendingOtp ? "Sending..." : "Resend OTP"}
            </button>
            {otpSeconds > 0 ? <p className="mt-2 text-sm font-bold text-[#667085]">Resend available in {otpTimerText}</p> : null}
            {otpError ? <p className="mt-3 text-sm font-bold text-red-500">{otpError}</p> : null}
          </div>

          <div className="mb-2">
            <button
              type="button"
              disabled={!canVerifyOtp || isVerifyingOtp}
              onClick={verifyOtp}
              className={cn(
                "relative h-14 w-full rounded-2xl text-base font-black text-white transition",
                canVerifyOtp && !isVerifyingOtp ? "bg-[#ff6d00]" : "bg-[#98a2b3]",
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
        className="flex min-h-[calc(100dvh-2.5rem)] flex-col"
      >
        <div className="flex-1 pt-14">
          <h1 className="max-w-sm text-[2.35rem] font-black leading-tight tracking-tight text-[#172033]">
            Enter your mobile number
          </h1>

          <label className="mt-9 flex h-14 items-center rounded-xl border border-[#c3cad5] bg-white px-4 focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#eef6ff]">
            <span className="border-r border-[#dfe4ea] pr-3 text-xl font-bold text-[#344054]">+91</span>
            <input
              value={cleanMobile}
              onChange={(event) => setMobile(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 text-xl font-semibold text-[#172033] outline-none placeholder:text-[#667085]"
              placeholder="Mobile number"
              inputMode="numeric"
              type="tel"
            />
          </label>

          <p className="mt-5 text-lg font-semibold text-[#98a2b3]">We do not spam you with calls or messages.</p>
          <p className="mt-5 text-base font-semibold leading-7 text-[#667085]">
            By signing up, I agree to the{" "}
            <Link href="/terms" className="font-black text-[#1677ff] underline underline-offset-4">
              T&C
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-black text-[#1677ff] underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mb-2">
          <button
            type="button"
            disabled={!canProceed || isSendingOtp}
            onClick={sendOtp}
            className={cn(
              "relative h-14 w-full rounded-2xl text-base font-black text-white transition",
              canProceed && !isSendingOtp ? "bg-[#ff6d00]" : "bg-[#98a2b3]",
            )}
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
          {otpError ? <p className="mt-3 text-center text-sm font-bold text-red-500">{otpError}</p> : null}
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
    otpDigits,
    otpError,
    otpSeconds,
    otpTimerText,
    profileError,
    router,
    step,
  ]);

  return (
    <>
      <AnimatePresence>{showDashboardTransition ? <ScorecareBrandAnimation message="Preparing your dashboard" /> : null}</AnimatePresence>
      <AnimatePresence mode="wait">{content}</AnimatePresence>
    </>
  );
}
