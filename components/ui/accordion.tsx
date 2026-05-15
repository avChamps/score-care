"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
      {items.map((item, index) => (
        <div key={item.question}>
          <button
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-slate-950 dark:text-white"
            onClick={() => setOpen(open === index ? -1 : index)}
          >
            {item.question}
            <ChevronDown className={cn("size-5 transition-transform", open === index && "rotate-180")} />
          </button>
          <div
            className={cn(
              "grid transition-all duration-300",
              open === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <p className="px-6 pb-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
