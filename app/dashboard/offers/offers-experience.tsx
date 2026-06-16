"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import comingSoonImage from "@/assets/coming-soon.png";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { DashboardHeaderHomeControl, PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

const notificationsPageSize = 10;

export function OffersExperience() {
  const router = useRouter();
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    try {
      const result = await loadNotifications(token);

      setNotificationUnreadCount(result.unreadCount);
    } catch {
      setNotificationUnreadCount(0);
    }
  }, [router]);

  useEffect(() => {
    void refreshNotifications();
    window.addEventListener("scorecare:notifications-updated", refreshNotifications);

    return () => window.removeEventListener("scorecare:notifications-updated", refreshNotifications);
  }, [refreshNotifications]);

  return (
    <PortalShell active="offers">
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PortalTopBar title="Offers" />
        <PageContent className="px-4 py-5">
          <div className="mx-auto max-w-md">
            <div className="mb-5 flex items-center justify-between">
              <DashboardHeaderHomeControl className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl" iconClassName="size-5" />
              <div className="flex items-center gap-3">
                <Link
                  aria-label="Open notifications"
                  className="relative grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
                  href="/notifications"
                >
                  <Bell className="size-6" strokeWidth={1.8} />
                  {notificationUnreadCount > 0 ? (
                    <span className="absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-[#FF3B30] px-1.5 text-caption font-bold leading-5 text-white shadow-[0_6px_12px_rgba(255,59,48,0.28)]">
                      {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>

            <section className="flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center text-center">
              <Image
                src={comingSoonImage}
                alt="Coming soon"
                className="mx-auto h-auto w-full max-w-xs"
                priority
              />
              <h1 className="mt-6 text-2xl font-black tracking-tight text-white">Offers Coming Soon</h1>
              <p className="mt-2 text-sm font-medium leading-6 text-[#9fb2c6]">
                Personalized loan, card, and credit offers will be available here soon.
              </p>
            </section>
          </div>
        </PageContent>

        <DashboardBottomNav />
      </div>
    </PortalShell>
  );
}

async function loadNotifications(token: string) {
  const response = await apiRequest(`/notifications?limit=${notificationsPageSize}&unreadOnly=false`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load notifications.");
  }

  const result = (await response.json()) as {
    status?: string;
    data?: {
      unreadCount?: number | null;
    };
  };

  return {
    unreadCount: result.status === "success" ? result.data?.unreadCount ?? 0 : 0,
  };
}
