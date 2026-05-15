import type { Metadata } from "next";
import { Bell, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = { title: "Notifications", description: "SCORECARE credit and account notifications." };

export default function NotificationsPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Notifications" title="Your credit alerts." />
      <div className="mx-auto max-w-3xl space-y-4">{["Score increased by 12 points", "New AI recommendation available", "Report plan invoice generated", "Consultation slot confirmed"].map((item, index) => <Card key={item} className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><Bell className="size-5 text-cyan-500" /><div><h2 className="font-bold">{item}</h2><p className="text-sm text-slate-500">{index + 1} hours ago</p></div></div><CheckCircle2 className="size-5 text-emerald-500" /></Card>)}</div>
    </Section>
  );
}
