import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28", className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-12 max-w-3xl", center && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-[#1f8a5b]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-black leading-[1.02] tracking-normal text-[#2d2119] dark:text-[#2d2119] sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-5 text-lg leading-8 text-[#6f5948] dark:text-[#6f5948]">{body}</p> : null}
    </div>
  );
}
