import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your SCORECARE dashboard.",
};

export default function LoginPage() {
  return (
    <section className="auth-page min-h-[calc(100vh-5rem)] bg-white px-4 py-5 text-[#172033] sm:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center gap-3 border-b border-[#eef0f3] pb-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#ff6d00] text-white">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black">ScoreCare</p>
            <p className="truncate text-xs font-semibold text-[#667085]">Login to manage your credit services</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e5ea] bg-white">
          <div className="border-b border-[#eef0f3] px-5 py-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ff6d00]">Login</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm leading-6 text-[#667085]">Use your registered email and password.</p>
          </div>

          <div className="grid gap-4 px-5 py-5">
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e2e5ea] bg-white text-sm font-bold text-[#172033]" type="button">
              <GoogleIcon /> Continue with Google
            </button>
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e2e5ea] bg-white text-sm font-bold text-[#172033]" type="button">
              <GmailIcon /> Continue with email OTP
            </button>

            <div className="relative py-1 text-center text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#98a2b3]">
              <span className="relative z-10 bg-white px-3">or</span>
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[#eef0f3]" />
            </div>

            <label className="text-sm font-bold text-[#344054]">
              Email address
              <input
                className="mt-2 h-12 w-full rounded-xl border border-[#dfe4ea] bg-white px-4 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                placeholder="you@company.com"
              />
            </label>

            <label className="text-sm font-bold text-[#344054]">
              Password
              <input
                className="mt-2 h-12 w-full rounded-xl border border-[#dfe4ea] bg-white px-4 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                placeholder="Enter password"
                type="password"
              />
            </label>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-[#667085]">
                <input type="checkbox" className="size-4 rounded border-[#cfd6df]" />
                Remember me
              </label>
              <a href="#" className="font-bold text-[#1677ff]">
                Forgot?
              </a>
            </div>

            <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ff6d00] text-sm font-black text-white">
              Login <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#e2e5ea] bg-white p-4 text-sm leading-6 text-[#667085]">
          <LockKeyhole className="mt-0.5 size-5 shrink-0 text-[#1677ff]" />
          Your account is protected with secure access and OTP recovery.
        </div>

        <p className="mt-5 text-center text-sm text-[#667085]">
          New to ScoreCare?{" "}
          <Link href="/signup" className="font-black text-[#1677ff]">
            Create account
          </Link>
        </p>
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
