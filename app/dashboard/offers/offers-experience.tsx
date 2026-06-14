"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import comingSoonImage from "@/assets/coming-soon.png";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export function OffersExperience() {
  return (
    <PortalShell active="offers">
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PortalTopBar title="Offers" />
        <PageContent className="px-4 py-5">
          <div className="mx-auto max-w-md">
            <div className="mb-5 flex items-center justify-between">
              <Link
                aria-label="Open profile menu"
                className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
                href="/profile"
              >
                <Menu className="size-5" strokeWidth={1.8} />
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  aria-label="Open notifications"
                  className="relative grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
                  href="/notifications"
                >
                  <Bell className="size-6" strokeWidth={1.8} />
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
