import Image from "next/image";
import { ArrowRight, Bot, CheckCircle2, FileCheck2, Gauge, Sparkles, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Floating, Reveal } from "@/components/ui/motion";

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-16">
      {/* Full section background video */}
      <div className="absolute inset-0 -z-20">
        <video
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/scorecare-hero-poster.jpg"
          className="hero-video-motion h-full w-full scale-105 object-cover opacity-45 saturate-[1.15] sepia-[0.2]"
        >
          <source src="/videos/scorecare-hero.mp4" type="video/mp4" />
        </video>

        <Image
          alt=""
          aria-hidden="true"
          src="/videos/scorecare-hero-poster.jpg"
          fill
          priority
          className="hero-video-poster object-cover opacity-55"
          sizes="100vw"
        />
      </div>

      {/* Warm readable overlay */}
      <div className="absolute inset-0 -z-10 bg-[#fff3dd]/82" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_25%,rgba(255,253,247,0.96),transparent_34%),radial-gradient(circle_at_82%_42%,rgba(139,216,182,0.28),transparent_28%),radial-gradient(circle_at_75%_75%,rgba(248,217,107,0.28),transparent_32%),linear-gradient(90deg,rgba(255,247,232,0.99)_0%,rgba(255,247,232,0.9)_46%,rgba(255,247,232,0.62)_100%)]" />
      <div className="absolute inset-0 -z-10 glass-grid opacity-40" />
      <div className="organic-blob absolute -right-16 top-24 -z-10 h-[28rem] w-[34rem] bg-[#8bd8b6]/28 blur-2xl" />
      <div className="organic-scoop absolute bottom-0 left-4 -z-10 size-56 bg-[#ffb38a]/22 blur-xl" />

      <div className="mx-auto grid min-h-[calc(100vh-150px)] max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <Reveal>
          <div className="max-w-4xl py-10 lg:py-16">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-[#1f8a5b]/20 bg-[#fffdf7]/80 px-4 py-2 text-xs font-black text-[#1f8a5b] shadow-sm backdrop-blur sm:text-sm">
              <Sparkles className="size-4 shrink-0" />
              <span className="truncate">Credit care, made warm and lender-ready</span>
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-normal text-[#2d2119] sm:text-7xl lg:text-[7.5rem]">
              Credit care that feels beautifully simple.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#6f5948] sm:text-lg sm:leading-8">
              Check scores, understand reports, and repair CIBIL issues inside a warm,
              secure workspace built for confident financial decisions.
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
              {["No score impact", "Encrypted report flow", "Expert-backed repair"].map(
                (item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 text-sm font-bold text-[#6f5948]"
                  >
                    <CheckCircle2 className="size-4 text-[#1f8a5b]" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative mx-auto w-full max-w-[42rem] py-8 sm:py-10">
            <div className="organic-blob absolute -left-10 top-6 -z-10 h-64 w-72 bg-[#8bd8b6]/34 blur-2xl" />
            <div className="organic-scoop absolute -right-8 bottom-10 -z-10 h-72 w-80 bg-[#ffb38a]/28 blur-2xl" />
            <div className="absolute left-1/2 top-1/2 -z-10 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[28px] border-[#f8d96b]/18" />

            <div className="relative mx-auto aspect-[0.92] max-h-[42rem] min-h-[28rem] overflow-hidden rounded-[4rem] border border-[#fffdf7]/70 bg-[#fff7e8] p-3 shadow-[0_42px_120px_rgba(92,62,37,0.22)] sm:rounded-[5rem] sm:p-4 lg:min-h-[38rem]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(248,217,107,0.45),transparent_26%),radial-gradient(circle_at_85%_72%,rgba(139,216,182,0.32),transparent_32%),linear-gradient(135deg,#fffdf7,#f7e7c6)]" />
              <div className="relative h-full overflow-hidden rounded-[3.35rem] bg-[#fff7e8] sm:rounded-[4.25rem]">
                <video
                  aria-hidden="true"
                  autoPlay
                  className="hero-video-motion h-full w-full scale-125 object-cover opacity-70 saturate-[1.18] sepia-[0.16]"
                  loop
                  muted
                  playsInline
                  poster="/videos/scorecare-hero-poster.jpg"
                  preload="auto"
                >
                  <source src="/videos/scorecare-hero.mp4" type="video/mp4" />
                </video>
                <Image
                  alt=""
                  aria-hidden="true"
                  className="hero-video-poster object-cover"
                  fill
                  priority
                  src="/videos/scorecare-hero-poster.jpg"
                  sizes="(min-width: 1024px) 620px, 100vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_22%,rgba(255,253,247,0.38),transparent_32%),linear-gradient(135deg,rgba(255,247,232,0.5),rgba(248,217,107,0.12)_45%,rgba(139,216,182,0.2))]" />
                <div className="pointer-events-none absolute inset-0 bg-[#fff7e8]/18 mix-blend-screen" />
                <div className="pointer-events-none absolute -left-20 top-12 size-72 rounded-full border-[30px] border-[#fff7e8]/16" />
                <div className="pointer-events-none absolute inset-0 rounded-[3.35rem] ring-1 ring-inset ring-white/30 sm:rounded-[4.25rem]" />
              </div>
            </div>

            <Floating className="absolute left-1 top-10 z-10 sm:-left-4 lg:left-0" delay={0.1}>
              <HeroBadge icon={<Gauge className="size-4" />} label="Credit Score" value="782" tone="mint" />
            </Floating>
            <Floating className="absolute right-0 top-24 z-10 sm:-right-2" delay={0.8}>
              <HeroBadge icon={<WalletCards className="size-4" />} label="Loan Eligible" value={"\u20b925L"} tone="gold" />
            </Floating>
            <Floating className="absolute bottom-9 left-3 z-10 sm:left-12" delay={1.2}>
              <HeroBadge icon={<Bot className="size-4" />} label="AI Report" value="Ready" tone="peach" />
            </Floating>
            <Floating className="absolute bottom-1 right-4 z-10 hidden sm:block" delay={1.8}>
              <HeroBadge icon={<FileCheck2 className="size-4" />} label="Repair" value="In Progress" tone="cream" />
            </Floating>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HeroBadge({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "mint" | "gold" | "peach" | "cream";
  value: string;
}) {
  const tones = {
    cream: "border-[#fff7e8]/80 bg-[#fffdf7]/82 text-[#2d2119]",
    gold: "border-[#f8d96b]/55 bg-[#fff3b7]/82 text-[#2d2119]",
    mint: "border-[#8bd8b6]/55 bg-[#e8fff2]/84 text-[#2d2119]",
    peach: "border-[#ffb38a]/55 bg-[#fff0df]/84 text-[#2d2119]",
  };

  return (
    <div className={`min-w-32 rounded-[1.25rem] border px-3.5 py-3 shadow-[0_16px_36px_rgba(45,33,25,0.13)] backdrop-blur-xl sm:min-w-36 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-[#1f8a5b]">
        {icon}
        <span className="text-[0.58rem] font-black uppercase tracking-[0.15em]">{label}</span>
      </div>
      <p className="mt-1 text-xl font-black leading-none sm:text-2xl">{value}</p>
    </div>
  );
}
