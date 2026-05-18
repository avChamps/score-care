import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-[#6f5948]/14 bg-[#fffdf7]/86 p-5 shadow-[0_22px_70px_rgba(92,62,37,0.12)] backdrop-blur-xl transition-colors dark:border-[#6f5948]/14 dark:bg-[#fffdf7]/86 dark:shadow-[0_22px_70px_rgba(92,62,37,0.12)] sm:rounded-[2.25rem] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
