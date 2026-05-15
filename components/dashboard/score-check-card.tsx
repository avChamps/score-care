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
          <p className="text-sm font-bold">Your CIBIL Score</p>
          <p className="text-xs text-slate-500">
            {checked ? "Last checked: just now" : "Meter ready. Tap below to fetch score."}
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
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
    <div className="relative mx-auto h-48 max-w-xs animate-[meterFade_0.45s_ease-out]">
      <div className="absolute inset-x-8 top-5 h-28 rounded-t-full border-[1rem] border-b-0 border-slate-200" />
      <div className="absolute inset-x-8 top-5 h-28 rounded-t-full border-[1rem] border-b-0 border-transparent border-l-emerald-400 border-t-cyan-500" />
      <div className="absolute left-1/2 top-[6.8rem] size-4 -translate-x-1/2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-200" />
      <div
        className="absolute left-1/2 top-[7rem] h-2.5 w-24 origin-left rounded-full bg-cyan-500 transition-transform duration-1000 ease-out [clip-path:polygon(0_50%,100%_0,100%_100%)]"
        style={{ transform: `rotate(${checked ? "-36deg" : "-90deg"})` }}
      />
      <div className="absolute inset-x-0 bottom-8 flex justify-between text-sm font-semibold text-slate-500">
        <span>300</span>
        <span>900</span>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
        {checked ? (
          <>
            <p className="text-2xl font-bold text-slate-950">782</p>
            <p className="text-xs font-bold text-emerald-600">Excellent</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-400">--</p>
            <p className="text-xs font-bold text-slate-400">Not checked</p>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreLegend() {
  const items = [
    ["bg-red-500", "Poor"],
    ["bg-lime-300", "Fair"],
    ["bg-emerald-400", "Good"],
    ["bg-green-500", "Excellent"],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.7rem] text-slate-600 sm:grid-cols-4">
      {items.map(([color, label]) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${color}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
