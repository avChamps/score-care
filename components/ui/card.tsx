import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-slate-200/70 bg-white/75 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_22px_80px_rgba(0,0,0,0.25)] sm:rounded-[1.75rem] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
