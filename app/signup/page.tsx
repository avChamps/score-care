import type { Metadata } from "next";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Signup",
  description: "Create your SCORECARE account with OTP verification and onboarding.",
};

export default function SignupPage() {
  return (
    <section className="organic-shell relative isolate overflow-hidden px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="absolute inset-0 -z-10 glass-grid opacity-60" />
      <div className="organic-blob absolute right-10 top-20 -z-10 size-52 bg-[#8bd8b6]/22" />
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f8a5b] sm:text-sm sm:tracking-[0.22em]">Create account</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] text-[#2d2119] sm:text-7xl">Start your credit upgrade path.</h1>
          <p className="mt-5 text-base leading-7 text-[#6f5948] sm:text-lg">Multi-step registration UI with OTP, password strength, terms, and onboarding preview.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Instant score check", "AI recommendations", "Repair concierge"].map((item) => (
              <div key={item} className="rounded-full border border-[#6f5948]/12 bg-[#fffdf7]/78 px-4 py-3 text-sm font-black text-[#6f5948] shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
        <Card className="relative overflow-hidden">
          <div className="organic-scoop absolute -right-14 -top-14 size-40 bg-[#ffb38a]/24" />
          <div className="mb-6 grid grid-cols-3 gap-2 text-center text-[0.68rem] font-black sm:text-xs">
            {["Profile", "OTP", "Welcome"].map((step, i) => (
              <span key={step} className={`rounded-full px-3 py-2 ${i === 0 ? "bg-[#2d2119] text-[#fff7e8]" : "bg-[#f7e7c6]/70 text-[#6f5948]"}`}>{step}</span>
            ))}
          </div>
          <div className="grid gap-4">
            {["Full name", "Email", "Mobile number"].map((label) => (
              <input key={label} className="h-[3.25rem] rounded-full border border-[#6f5948]/12 bg-[#fffdf7] px-5 text-sm font-semibold outline-none transition focus:border-[#1f8a5b]/40 focus:ring-4 focus:ring-[#8bd8b6]/20" placeholder={label} />
            ))}
            <input className="h-[3.25rem] rounded-full border border-[#6f5948]/12 bg-[#fffdf7] px-5 text-sm font-semibold outline-none transition focus:border-[#1f8a5b]/40 focus:ring-4 focus:ring-[#8bd8b6]/20" placeholder="Create password" type="password" />
            <div className="h-2 rounded-full bg-[#f7e7c6]"><div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-[#1f8a5b] to-[#8bd8b6]" /></div>
            <label className="flex gap-3 text-sm leading-6 text-[#6f5948]"><input type="checkbox" /> I agree to terms, privacy, and consent-based credit processing.</label>
            <Button href="/dashboard">Create account</Button>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-[#8bd8b6]/30 bg-[#8bd8b6]/14 p-4 text-sm leading-6 text-[#1f8a5b]">
            <ShieldCheck className="mb-2 size-5" /> OTP verification and welcome onboarding are ready as UI states.
          </div>
        </Card>
      </div>
      <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3">
        {["Secure consent", "Score preview", "Guided next steps"].map((item) => (
          <Card key={item} className="flex items-center gap-3">
            {item === "Guided next steps" ? <Sparkles className="size-5 text-[#1f8a5b]" /> : <Check className="size-5 text-[#1f8a5b]" />}
            <span className="font-black text-[#2d2119]">{item}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}
