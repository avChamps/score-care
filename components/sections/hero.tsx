import Image from "next/image";
import { ArrowRight, BadgeCheck, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Floating, Reveal } from "@/components/ui/motion";

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.20),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,0.88))] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.24),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.96))]" />
      <div className="absolute left-1/2 top-20 -z-10 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-cyan-400/15 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
        <Reveal>
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-cyan-200 sm:text-sm">
              <Sparkles className="size-4 shrink-0" />
              <span className="truncate">AI-powered credit intelligence for modern India</span>
            </div>
            <h1 className="text-4xl font-semibold leading-[1.04] tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
              Build lender-ready credit with SCORECARE.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
              Check your credit score, decode your report with AI, and repair CIBIL issues through a secure premium fintech workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/credit-score" size="lg">
                Free Credit Score Check <ArrowRight className="size-5" />
              </Button>
              <Button href="/ai-analysis" variant="secondary" size="lg">
                See AI Analysis
              </Button>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {["No score impact", "Encrypted report flow", "Expert-backed repair"].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="size-4 text-cyan-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-8 top-16 z-10 hidden md:block">
              <Floating>
                <Card className="w-44 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-500">Score</p>
                  <p className="mt-2 text-4xl font-black text-slate-950 dark:text-white">782</p>
                  <p className="text-sm text-emerald-500">+34 this quarter</p>
                </Card>
              </Floating>
            </div>
            <div className="absolute -right-4 bottom-12 z-10 hidden md:block">
              <Floating>
                <Card className="w-52 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <LockKeyhole className="size-4 text-cyan-500" />
                    Secure consent vault
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                  </div>
                </Card>
              </Floating>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/40 bg-slate-950 shadow-[0_35px_100px_rgba(15,23,42,0.28)] dark:border-white/10">
              <div className="relative aspect-[4/5] sm:aspect-[5/4]">
                <Image
                  src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1400&q=80"
                  alt="Financial dashboard and premium credit planning"
                  fill
                  priority
                  className="object-cover opacity-80"
                  sizes="(min-width: 1024px) 560px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-blue-950/50 to-cyan-400/20" />
                <div className="absolute inset-x-3 bottom-3 rounded-[1.25rem] border border-white/15 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:rounded-[1.5rem] sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-100">Approval readiness</p>
                      <p className="text-2xl font-bold sm:text-3xl">92%</p>
                    </div>
                    <BadgeCheck className="size-8 text-cyan-300 sm:size-10" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-[0.68rem] text-slate-200 sm:mt-5 sm:text-xs">
                    <span>Utilization</span>
                    <span>History</span>
                    <span>Mix</span>
                    <span className="h-1.5 rounded-full bg-cyan-300" />
                    <span className="h-1.5 rounded-full bg-blue-300" />
                    <span className="h-1.5 rounded-full bg-indigo-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
