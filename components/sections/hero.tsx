import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-20">
        <video
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/scorecare-hero-poster.jpg"
          className="hero-video-motion h-full w-full scale-105 object-cover opacity-95 saturate-[1.16] sepia-[0.08]"
        >
          <source src="/videos/scorecare-hero.mp4" type="video/mp4" />
        </video>

        <Image
          alt=""
          aria-hidden="true"
          src="/videos/scorecare-hero-poster.jpg"
          fill
          priority
          className="hero-video-poster object-cover opacity-95"
          sizes="100vw"
        />
      </div>

      <div className="absolute inset-0 -z-10 bg-[#2d2119]/56" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_28%,rgba(248,217,107,0.14),transparent_28%),linear-gradient(180deg,rgba(45,33,25,0.2)_0%,rgba(45,33,25,0.54)_72%,rgba(45,33,25,0.78)_100%)]" />

      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center pb-14 pt-32 text-center sm:pt-36 lg:pt-32">
        <Reveal className="w-full">
          <div className="mx-auto max-w-5xl">
            <h1 className="mx-auto max-w-5xl text-5xl font-black uppercase leading-[0.96] tracking-normal text-white drop-shadow-[0_12px_30px_rgba(0,0,0,0.28)] sm:text-7xl md:text-8xl lg:text-[5.2rem] xl:text-[5.8rem]">
              Credit care made simple
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base font-semibold leading-7 text-[#fff7e8] drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)] sm:text-lg sm:leading-8">
              Check scores, understand reports, and repair CIBIL issues inside a warm,
              secure workspace built for confident financial decisions.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/credit-score" size="lg">
                Free Credit Score Check <ArrowRight className="size-5" />
              </Button>

              <Button href="/ai-analysis" variant="secondary" size="lg">
                See AI Analysis
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
