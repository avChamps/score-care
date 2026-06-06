import type { Metadata } from "next";
import Link from "next/link";
import { Check, UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Signup",
  description: "Create your SCORECARE account with OTP verification and onboarding.",
};

export default function SignupPage() {
  return (
    <section className="auth-page min-h-[calc(100vh-5rem)] bg-white px-4 py-5 text-[#172033] sm:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center gap-3 border-b border-[#eef0f3] pb-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#1677ff] text-white">
            <UserPlus className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black">Create ScoreCare account</p>
            <p className="truncate text-xs font-semibold text-[#667085]">Verify once and continue to dashboard</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e2e5ea] bg-white">
          <div className="border-b border-[#eef0f3] px-5 py-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ff6d00]">Signup</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Set up your account</h1>
            <p className="mt-1 text-sm leading-6 text-[#667085]">Enter your details to start secure onboarding.</p>
          </div>

          <div className="px-5 pt-5">
            <div className="grid grid-cols-3 gap-2 text-center text-[0.68rem] font-black">
              <span className="rounded-full bg-[#172033] px-3 py-2 text-white">Profile</span>
              <span className="rounded-full border border-[#e2e5ea] bg-[#fafafa] px-3 py-2 text-[#667085]">OTP</span>
              <span className="rounded-full border border-[#e2e5ea] bg-[#fafafa] px-3 py-2 text-[#667085]">Done</span>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5">
            {["Full name", "Email", "Mobile number"].map((label) => (
              <input
                key={label}
                className="h-12 rounded-xl border border-[#dfe4ea] bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-[#98a2b3] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
                placeholder={label}
              />
            ))}

            <input
              className="h-12 rounded-xl border border-[#dfe4ea] bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-[#98a2b3] focus:border-[#1677ff] focus:ring-2 focus:ring-[#eef6ff]"
              placeholder="Create password"
              type="password"
            />

            <div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eef6ff]">
                <div className="h-full w-3/4 rounded-full bg-[#1677ff]" />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#667085]">Password strength: good</p>
            </div>

            <label className="flex gap-3 text-sm leading-6 text-[#667085]">
              <input type="checkbox" className="mt-1 size-4 rounded border-[#cfd6df]" />
              I agree to terms, privacy, and consent-based credit processing.
            </label>

            <Link href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#ff6d00] text-sm font-black text-white">
              Create account
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e2e5ea] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
              <Check className="size-4" />
            </span>
            <div>
              <p className="text-sm font-black">Secure onboarding</p>
              <p className="mt-1 text-sm leading-6 text-[#667085]">
                OTP verification and consent checks continue after account creation.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-[#667085]">
          Already have an account?{" "}
          <Link href="/login" className="font-black text-[#1677ff]">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
