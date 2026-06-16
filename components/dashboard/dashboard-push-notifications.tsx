"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { initializePushNotifications } from "@/src/lib/pushNotifications";

export function DashboardPushNotifications() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: Awaited<ReturnType<typeof initializePushNotifications>> = null;

    async function initialize() {
      const token = localStorage.getItem("scorecare_token");

      cleanup = await initializePushNotifications(token ?? "", {
        onNotificationClick: (path) => router.push(path),
      });
    }

    void initialize();

    return () => {
      if (cleanup) {
        void cleanup.remove();
      }
    };
  }, [router]);

  return null;
}
