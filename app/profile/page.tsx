import type { Metadata } from "next";
import { BadgeCheck, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = { title: "User Profile", description: "Manage your SCORECARE user profile and verification details." };

export default function ProfilePage() {
  return (
    <Section>
      <SectionHeader eyebrow="Profile" title="Your verified credit profile." />
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card className="text-center"><UserRound className="mx-auto size-16 text-cyan-500" /><h2 className="mt-4 text-2xl font-black">Aarav Mehta</h2><p className="text-slate-500">Premium member</p><BadgeCheck className="mx-auto mt-5 size-8 text-emerald-500" /></Card>
        <Card><div className="grid gap-4 md:grid-cols-2">{["Email", "Phone", "PAN status", "Plan", "Risk appetite", "Report cadence"].map((item) => <div key={item} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item}</p><p className="mt-2 font-bold">Verified</p></div>)}</div></Card>
      </div>
    </Section>
  );
}
