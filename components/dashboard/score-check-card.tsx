"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { AppCard, PrimaryPortalButton } from "@/components/dashboard/portal-ui";

export function ScoreCheckCard() {
  const [checked, setChecked] = useState(false);

  return (
    <AppCard className="xl:row-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[#2d2119]">Your CIBIL Score</p>
          <p className="text-xs text-[#6f5948]">
            {checked ? "Last checked: just now" : "Meter ready. Tap below to fetch score."}
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-[#8bd8b6]/22 text-[#1f8a5b]">
          <Gauge className="size-4" />
        </span>
      </div>

      <div className="mt-4">
        <ScoreMeter checked={checked} />
      </div>

      <ScoreLegend />

      <PrimaryPortalButton type="button" onClick={() => setChecked(true)} className="mt-6 w-full">
        {checked ? "Refresh Credit Score" : "Check Your Credit Score"}
      </PrimaryPortalButton>
    </AppCard>
  );
}

function ScoreMeter({ checked }: { checked: boolean }) {
  return (
    <div className="relative mx-auto h-48 w-full max-w-xs animate-[meterFade_0.45s_ease-out]">
      <svg className="absolute left-1/2 top-5 h-28 w-56 -translate-x-1/2 overflow-visible" viewBox="0 0 224 112" aria-hidden="true">
        <path d="M 8 104 A 104 104 0 0 1 216 104" fill="none" stroke="#f7e7c6" strokeLinecap="round" strokeWidth="16" />
        <path d="M 8 104 A 104 104 0 0 1 216 104" fill="none" stroke="#ff8a7a" strokeDasharray="81.7 245.1" strokeDashoffset="0" strokeLinecap="round" strokeWidth="16" />
        <path d="M 8 104 A 104 104 0 0 1 216 104" fill="none" stroke="#f8d96b" strokeDasharray="81.7 245.1" strokeDashoffset="-81.7" strokeLinecap="round" strokeWidth="16" />
        <path d="M 8 104 A 104 104 0 0 1 216 104" fill="none" stroke="#8bd8b6" strokeDasharray="81.7 245.1" strokeDashoffset="-163.4" strokeLinecap="round" strokeWidth="16" />
        <path d="M 8 104 A 104 104 0 0 1 216 104" fill="none" stroke="#1f8a5b" strokeDasharray="81.7 245.1" strokeDashoffset="-245.1" strokeLinecap="round" strokeWidth="16" />
      </svg>
      <div className="absolute left-1/2 top-[6.8rem] size-4 -translate-x-1/2 rounded-full bg-[#1f8a5b] shadow-lg shadow-[#8bd8b6]/50" />
      <div
        className="absolute left-1/2 top-[7rem] h-2.5 w-24 origin-left rounded-full bg-[#1f8a5b] transition-transform duration-1000 ease-out [clip-path:polygon(0_50%,100%_0,100%_100%)]"
        style={{ transform: `rotate(${checked ? "-36deg" : "-90deg"})` }}
      />
      <div className="absolute inset-x-0 bottom-8 flex justify-between text-sm font-semibold text-[#6f5948]">
        <span>300</span>
        <span>900</span>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
        {checked ? (
          <>
            <p className="text-2xl font-black text-[#2d2119]">782</p>
            <p className="text-xs font-black text-[#1f8a5b]">Excellent</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-[#6f5948]/45">--</p>
            <p className="text-xs font-bold text-[#6f5948]/45">Not checked</p>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreLegend() {
  const items = [
    ["bg-red-500", "Poor (300-579)"],
    ["bg-lime-300", "Fair (580-669)"],
    ["bg-emerald-400", "Good (670-739)"],
    ["bg-green-500", "Excellent (740-900)"],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.68rem] text-[#6f5948]">
      {items.map(([color, label]) => (
        <div key={label} className="flex min-w-0 items-center gap-2">
          <span className={`size-2.5 shrink-0 rounded-full ${color}`} />
          <span className="leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
}
