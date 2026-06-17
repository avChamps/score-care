"use client";

import { useCapacitorAppLifecycle } from "@/src/hooks/useCapacitorAppLifecycle";

export function AppLifecycleProvider({ children }: { children: React.ReactNode }) {
  useCapacitorAppLifecycle();

  return children;
}
