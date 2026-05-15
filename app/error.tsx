"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-500">Something slipped</p>
      <h1 className="mt-4 text-4xl font-black text-slate-950 dark:text-white">We could not load this SCORECARE view.</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">Try again and the app will re-render the page.</p>
      <Button className="mt-8" onClick={reset}>Try again</Button>
    </div>
  );
}
