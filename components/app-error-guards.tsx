"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

export function AppErrorGuards() {
  useEffect(() => {
    console.info("[ScoreCare] app boot");
    console.info("[ScoreCare] API base URL", API_BASE_URL);

    const handleError = (event: ErrorEvent) => {
      console.error("[ScoreCare] window error", event.error ?? event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[ScoreCare] unhandled rejection", event.reason);
      event.preventDefault();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
