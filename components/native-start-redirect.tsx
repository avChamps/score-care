"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

export function NativeStartRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
