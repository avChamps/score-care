"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, FileText, Gift, Home, Menu, ReceiptText, TrendingUp } from "lucide-react";
import comingSoonImage from "@/assets/coming-soon.png";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { cn } from "@/lib/utils";

const offersBottomNav = [
  { label: "Home", href: "/dashboard", Icon: Home },
  { label: "Report", href: "/dashboard/credit-score", Icon: FileText },
  { label: "Improve", href: "/dashboard/score-fix", Icon: TrendingUp },
  { label: "Offers", href: "/dashboard/offers", Icon: Gift },
  { label: "Loans", href: "/dashboard/loans", Icon: ReceiptText },
];

export function OffersExperience() {
  return (
    <PortalShell active="score">
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

        <div className="fixed bottom-3 left-0 right-0 z-30 px-4 pb-[env(safe-area-inset-bottom)]">
          <nav className="floating-bottom-nav mx-auto grid max-w-[27rem] grid-cols-5 rounded-[32px] border border-[#1F756B]/35 bg-[#07130F]/88 px-3 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.42),inset_0_0_28px_rgba(31,117,107,0.08)] backdrop-blur-2xl">
            {offersBottomNav.map(({ label, href, Icon }) => {
              const active = label === "Offers";
              const disabled = label !== "Home" && label !== "Report" && label !== "Offers" && label !== "Loans";

              if (disabled) {
                return (
                  <button
                    key={label}
                    aria-disabled="true"
                    className="flex min-h-[58px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-[20px] px-0.5 py-1 text-[12px] font-semibold text-[#5B716A] opacity-55"
                    disabled
                    type="button"
                  >
                    <span className="grid size-8 place-items-center rounded-[14px]">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span>{label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={label}
                  href={href}
                  data-dashboard-loans={href === "/dashboard/loans" ? "true" : undefined}
                  data-dashboard-offers={href === "/dashboard/offers" ? "true" : undefined}
                  className={cn("flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[20px] px-0.5 py-1 text-[12px] font-semibold tracking-normal text-[#5B716A] transition duration-300", active ? "text-[#18B98E]" : "hover:text-[#88A39A]")}
                >
                  <span className={cn("grid size-8 place-items-center rounded-[14px] text-[#5B716A]", active && "border border-[#18B98E]/45 bg-[#18B98E]/12 text-[#18B98E] shadow-[0_0_16px_rgba(24,185,142,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]")}>
                    <Icon className="size-4" strokeWidth={active ? 2.1 : 1.75} />
                  </span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </PortalShell>
  );
}
