import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { footerGroups, securityBadges } from "@/lib/site";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#6f5948]/15 bg-[#2d2119] px-4 py-14 text-[#fff7e8] sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f8d96b] to-transparent" />
      <div className="absolute inset-0 organic-rings opacity-20" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-7 text-[#f7e7c6]">
            Premium credit intelligence, AI analysis, and repair support for individuals and businesses building stronger financial access.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {securityBadges.slice(0, 3).map((badge) => (
              <span key={badge.label} className="inline-flex items-center gap-2 rounded-full border border-[#fff7e8]/15 bg-[#fff7e8]/8 px-3 py-2 text-xs text-[#f7e7c6]">
                <badge.icon className="size-3.5 text-[#8bd8b6]" />
                {badge.label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black text-[#fff7e8]">{group.title}</h3>
              <div className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm text-[#f7e7c6] transition hover:text-[#8bd8b6]">
                    {link.label}
                    <ArrowUpRight className="size-3" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-[#fff7e8]/15 pt-6 text-xs text-[#f7e7c6]/80 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 SCORECARE Financial Technologies. All rights reserved.</span>
        <span className="inline-flex items-center gap-2">
          <BadgeCheck className="size-4 text-[#8bd8b6]" />
          Built for secure credit education and advisory workflows.
        </span>
      </div>
    </footer>
  );
}
