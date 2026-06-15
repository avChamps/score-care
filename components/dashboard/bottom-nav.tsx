"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BadgeIndianRupee, FileText, Gift, Home, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const dashboardTabs = [
  { label: "Home", href: "/dashboard", Icon: Home },
  { label: "Report", href: "/dashboard/credit-score", Icon: FileText },
  { label: "Improve", href: "/dashboard/score-fix", Icon: TrendingUp },
  { label: "Offers", href: "/dashboard/offers", Icon: Gift },
  { label: "Loans", href: "/dashboard/loans", Icon: BadgeIndianRupee },
];

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-2 left-0 right-0 z-30 px-4 pb-[max(4px,env(safe-area-inset-bottom))]">
      <nav className="floating-bottom-nav mx-auto grid max-w-[25rem] grid-cols-5 overflow-hidden rounded-[26px] border border-[#1F756B]/35 bg-[#07130F]/88 px-2 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.35),inset_0_0_20px_rgba(31,117,107,0.06)] backdrop-blur-2xl">
        {dashboardTabs.map(({ label, href, Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              data-dashboard-home={href === "/dashboard" ? "true" : undefined}
              data-dashboard-score={href === "/dashboard/credit-score" ? "true" : undefined}
              data-dashboard-score-fix={href === "/dashboard/score-fix" ? "true" : undefined}
              data-dashboard-loans={href === "/dashboard/loans" ? "true" : undefined}
              data-dashboard-offers={href === "/dashboard/offers" ? "true" : undefined}
              className={cn(
                "relative flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] px-1 py-1 text-tiny font-semibold tracking-normal transition duration-300",
                active ? "text-[#18B98E]" : "text-[#5B716A]"
              )}
            >
              <span className="relative z-10 grid size-8 place-items-center">
                {active ? (
                  <motion.span
                    layoutId="dashboard-bottom-nav-active"
                    className="absolute inset-0 rounded-[14px] border border-[#22F2C2]/40 bg-[rgba(34,242,194,0.08)] shadow-[0_0_10px_rgba(34,242,194,0.16)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}

                <Icon
                  className={cn("relative z-10 size-3.5", active ? "text-[#18B98E]" : "text-[#5B716A]")}
                  strokeWidth={active ? 2 : 1.75}
                />
              </span>

              <span className="relative z-10 max-w-full truncate leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}