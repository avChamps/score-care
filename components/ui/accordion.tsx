"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-[#6f5948]/12 overflow-hidden rounded-[2rem] border border-[#6f5948]/12 bg-[#fffdf7]/85 shadow-xl shadow-[#6f5948]/10 backdrop-blur">
      {items.map((item, index) => (
        <div key={item.question}>
          <button
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-black text-[#2d2119]"
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
              <p className="px-6 pb-5 text-sm leading-7 text-[#6f5948]">{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
