"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

const launchVideoSrc = "/loginpage-animation-20260617.mp4";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem("scorecare_token");

      if (token && !isTokenExpired(token)) {
        router.replace("/dashboard");
        return;
      }

      clearScorecareSession();
      router.replace("/login");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 z-[120] h-[100dvh] w-[100vw] overflow-hidden bg-[#020B18]">
      <video autoPlay muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-fill">
        <source src={launchVideoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
