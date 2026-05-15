import type { Metadata } from "next";
import { Check, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Signup",
  description: "Create your SCORECARE account with OTP verification and onboarding.",
};

export default function SignupPage() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-500 sm:text-sm sm:tracking-[0.22em]">Create account</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 dark:text-white sm:text-6xl">Start your credit upgrade path.</h1>
          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">Multi-step registration UI with OTP, password strength, terms, and onboarding preview.</p>
        </div>
        <Card>
          <div className="mb-6 grid grid-cols-3 gap-2 text-center text-[0.68rem] font-bold sm:text-xs">
            {["Profile", "OTP", "Welcome"].map((step, i) => <span key={step} className={`rounded-full px-3 py-2 ${i === 0 ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 dark:bg-white/10"}`}>{step}</span>)}
          </div>
          <div className="grid gap-4">
            {["Full name", "Email", "Mobile number"].map((label) => <input key={label} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/5" placeholder={label} />)}
            <input className="h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/5" placeholder="Create password" type="password" />
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" /></div>
            <label className="flex gap-3 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" /> I agree to terms, privacy, and consent-based credit processing.</label>
            <Button href="/dashboard">Create account</Button>
          </div>
          <div className="mt-6 rounded-2xl bg-cyan-500/10 p-4 text-sm text-cyan-700 dark:text-cyan-200"><ShieldCheck className="mb-2 size-5" /> OTP verification and welcome onboarding are ready as UI states.</div>
        </Card>
      </div>
      <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3">{["Instant score check", "AI recommendations", "Repair concierge"].map((item) => <Card key={item} className="flex items-center gap-3"><Check className="size-5 text-cyan-500" />{item}</Card>)}</div>
    </section>
  );
}
