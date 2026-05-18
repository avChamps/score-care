import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";

export function PageHero({
  eyebrow,
  title,
  body,
  primary = "Get started",
  href = "/signup",
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  primary?: string;
  href?: string;
  children?: ReactNode;
}) {
  return (
    <section className="organic-shell relative isolate overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <div className="absolute inset-0 -z-10 glass-grid opacity-70" />
      <div className="absolute -right-10 top-14 -z-10 h-36 w-1/3 rounded-l-[4rem] bg-[#8bd8b6]/25" />
      <div className="absolute bottom-10 left-0 -z-10 h-28 w-1/4 rounded-r-[4rem] bg-[#ffb38a]/20" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
        <Reveal>
          <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#1f8a5b] sm:text-sm sm:tracking-[0.22em]">{eyebrow}</p>
          <h1 className="max-w-4xl text-5xl font-black leading-[1] tracking-normal text-[#2d2119] dark:text-[#2d2119] sm:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#6f5948] dark:text-[#6f5948] sm:text-lg sm:leading-8">{body}</p>
          <Button href={href} className="mt-8" size="lg">
            {primary}
          </Button>
        </Reveal>
        {children ? <Reveal delay={0.12}>{children}</Reveal> : null}
      </div>
    </section>
  );
}
