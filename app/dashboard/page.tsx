import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { dashboardCards, sidebarItems } from "@/lib/site";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "SCORECARE dashboard with credit analytics, AI recommendations, and financial insights.",
};

export default function DashboardPage() {
  return (
    <section className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03] lg:block">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-cyan-500">Dashboard</p>
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <item.icon className="size-4" />
              {item.label}
            </a>
          ))}
        </div>
      </aside>

      <Section className="py-10 lg:py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-500 sm:text-sm sm:tracking-[0.22em]">
              Overview
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">
              Credit command center
            </h1>
          </div>
          <span className="w-fit rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-500">
            Updated 2 minutes ago
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <Card key={card.label}>
              <card.icon className="size-7 text-cyan-500" />
              <p className="mt-5 text-sm text-slate-500">{card.label}</p>
              <p className="text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">{card.value}</p>
              <p className="mt-2 text-sm text-emerald-500">{card.change}</p>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Score trend</h2>
              <ArrowUpRight className="size-5 text-cyan-500" />
            </div>
            <div className="mt-8 flex h-52 items-end gap-2 sm:h-72 sm:gap-3">
              {[42, 54, 49, 67, 72, 78, 86, 92].map((height, index) => (
                <div
                  key={index}
                  className="min-w-0 flex-1 rounded-t-xl bg-gradient-to-t from-blue-700 to-cyan-300 sm:rounded-t-2xl"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </Card>

          <Card className="bg-slate-950 text-white">
            <h2 className="text-xl font-bold">AI recommendations</h2>
            <div className="mt-5 space-y-4">
              {[
                "Pay down card ending 2042 by Rs.18,000",
                "Dispute duplicate inquiry from March",
                "Keep oldest account active",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>
    </section>
  );
}
