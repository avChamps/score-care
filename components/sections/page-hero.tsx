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
    <section className="relative isolate overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <div className="absolute inset-0 -z-10 glass-grid bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.16),transparent_30%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
        <Reveal>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-cyan-500 sm:text-sm sm:tracking-[0.22em]">{eyebrow}</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">{body}</p>
          <Button href={href} className="mt-8" size="lg">
            {primary}
          </Button>
        </Reveal>
        {children ? <Reveal delay={0.12}>{children}</Reveal> : null}
      </div>
    </section>
  );
}
