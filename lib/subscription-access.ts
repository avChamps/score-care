"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

type SubscriptionProfile = {
  accessType?: string | null;
  subscriptionStatus?: string | null;
};

export function useSubscriptionAccess() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isFreeTier, setIsFreeTier] = useState(false);

  useEffect(() => {
    async function loadAccess() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      try {
        const response = await apiRequest("/users/me/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setIsFreeTier(false);
          return;
        }

        const result = await response.json();
        const user = (result?.data?.user ?? null) as SubscriptionProfile | null;
        const accessType = user?.accessType?.toLowerCase() ?? "";
        const subscriptionStatus = user?.subscriptionStatus?.toLowerCase() ?? "";

        setIsFreeTier(accessType === "free" || accessType === "expired" || subscriptionStatus === "free" || subscriptionStatus === "expired");
      } catch {
        setIsFreeTier(false);
      } finally {
        setLoading(false);
      }
    }

    loadAccess();
  }, [router]);

  return { isFreeTier, loading };
}
