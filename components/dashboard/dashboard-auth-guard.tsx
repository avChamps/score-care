"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

export function DashboardAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
    }
  }, [router]);

  return null;
}
