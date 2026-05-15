import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { footerGroups, securityBadges } from "@/lib/site";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/70 bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="absolute -left-24 bottom-0 size-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute right-0 top-0 size-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            Premium credit intelligence, AI analysis, and repair support for individuals and businesses building stronger financial access.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {securityBadges.slice(0, 3).map((badge) => (
              <span key={badge.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                <badge.icon className="size-3.5 text-cyan-300" />
                {badge.label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold text-white">{group.title}</h3>
              <div className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-cyan-200">
                    {link.label}
                    <ArrowUpRight className="size-3" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 SCORECARE Financial Technologies. All rights reserved.</span>
        <span className="inline-flex items-center gap-2">
          <BadgeCheck className="size-4 text-cyan-300" />
          Built for secure credit education and advisory workflows.
        </span>
      </div>
    </footer>
  );
}
