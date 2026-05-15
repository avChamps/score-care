import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your SCORECARE dashboard.",
};

export default function LoginPage() {
  return (
    <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="absolute inset-0 -z-10 glass-grid bg-[radial-gradient(circle_at_12%_10%,rgba(37,99,235,0.22),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(6,182,212,0.20),transparent_28%),linear-gradient(135deg,rgba(248,250,252,1),rgba(239,246,255,0.92))] dark:bg-[radial-gradient(circle_at_12%_10%,rgba(37,99,235,0.24),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(6,182,212,0.16),transparent_28%),linear-gradient(135deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]" />
      <div className="absolute left-1/2 top-16 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 lg:order-1">
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/40 bg-white/70 px-3 py-2 text-xs font-bold text-blue-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-cyan-200 sm:mb-8 sm:text-sm">
            <ShieldCheck className="size-4 shrink-0" />
            <span className="truncate">Secure credit workspace</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-6xl">
            Welcome back to your credit command center.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
            Continue to your SCORECARE dashboard for score tracking, AI report analysis, repair workflows, and premium financial insights.
          </p>

          <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2">
            <Card className="border-blue-200/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Credit score</p>
                <BadgeCheck className="size-5 text-emerald-500" />
              </div>
              <p className="mt-4 text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">782</p>
              <div className="mt-5 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-2 w-[86%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
              </div>
              <p className="mt-3 text-sm text-emerald-500">+34 points this quarter</p>
            </Card>

            <Card className="border-cyan-200/70 bg-slate-950 text-white dark:border-white/10">
              <Sparkles className="size-7 text-cyan-300" />
              <p className="mt-5 text-sm text-slate-300">AI recommendation</p>
              <p className="mt-2 text-base font-bold leading-7 sm:text-lg">
                Reduce revolving utilization below 25% before your next loan application.
              </p>
            </Card>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {["Encrypted login", "OTP recovery", "Consent-first access"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <Card className="w-full max-w-md border-white/70 bg-white/[0.82] p-4 shadow-[0_30px_100px_rgba(37,99,235,0.18)] dark:border-white/10 dark:bg-slate-950/[0.72] sm:p-7">
            <div className="rounded-[1.25rem] border border-slate-200/80 bg-gradient-to-br from-white to-blue-50/70 p-4 dark:border-white/10 dark:from-white/[0.08] dark:to-cyan-400/[0.04] sm:rounded-[1.5rem] sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-500">Login</p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    Access SCORECARE
                  </h2>
                </div>
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg dark:bg-white dark:text-blue-700 sm:size-12">
                  <Fingerprint className="size-5 sm:size-6" />
                </div>
              </div>

              <div className="mt-7 grid gap-3">
                <Button variant="secondary" className="h-12 w-full justify-center">
                  <GoogleIcon /> Continue with Google
                </Button>
                <Button variant="secondary" className="h-12 w-full justify-center">
                  <GmailIcon /> Continue with email OTP
                </Button>

                <div className="relative py-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  <span className="bg-white px-3 dark:bg-slate-950">or password</span>
                  <div className="absolute left-0 right-0 top-1/2 -z-10 h-px bg-slate-200 dark:bg-white/10" />
                </div>

                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email address
                  <input
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-white/5"
                    placeholder="you@company.com"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                  <input
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-white/5"
                    placeholder="Enter password"
                    type="password"
                  />
                </label>

                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <input type="checkbox" className="size-4 rounded border-slate-300" />
                    Remember me
                  </label>
                  <a href="#" className="font-bold text-cyan-600 dark:text-cyan-300">
                    Forgot password?
                  </a>
                </div>

                <Button href="/dashboard" className="mt-2 h-14 w-full">
                  Login securely <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 text-sm leading-6 text-slate-600 dark:text-cyan-100">
              <LockKeyhole className="mt-0.5 size-5 shrink-0 text-cyan-500" />
              Your session is protected with secure device checks and OTP recovery.
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0">
      <path fill="#EA4335" d="M3.5 6.75v10.5A2.25 2.25 0 0 0 5.75 19.5H8.5V10.3L3.5 6.75z" />
      <path fill="#34A853" d="M15.5 19.5h2.75a2.25 2.25 0 0 0 2.25-2.25V6.75l-5 3.55v9.2z" />
      <path fill="#FBBC05" d="M15.5 6.75 12 9.38 8.5 6.75v3.55l3.5 2.63 3.5-2.63V6.75z" />
      <path fill="#4285F4" d="M3.5 6.75 8.5 10.3V6.75L5.85 4.77A1.46 1.46 0 0 0 3.5 5.94v.81z" />
      <path fill="#C5221F" d="M15.5 10.3 20.5 6.75v-.81a1.46 1.46 0 0 0-2.35-1.17L15.5 6.75v3.55z" />
    </svg>
  );
}
