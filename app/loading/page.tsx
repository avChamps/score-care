"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScorecareBrandAnimation } from "@/components/auth/scorecare-brand-animation";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/login");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [router]);

  return <ScorecareBrandAnimation message="Welcome to ScoreCare" />;
}
