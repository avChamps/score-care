"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

export function NativeStartRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const token = localStorage.getItem("scorecare_token");

      if (token && !isTokenExpired(token)) {
        router.replace("/dashboard");
        return;
      }

      clearScorecareSession();
      router.replace("/login");
    }
  }, [router]);

  return null;
}
