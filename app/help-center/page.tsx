import type { Metadata } from "next";
import { HelpCircle, MessageCircle, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = { title: "Help Center", description: "Find answers and support for SCORECARE products." };

export default function HelpCenterPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Help" title="How can we help?" body="Search product, billing, report, AI analysis, and CIBIL repair topics." />
      <Card className="mx-auto max-w-3xl"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 dark:border-white/10"><Search className="size-5 text-cyan-500" /><input className="h-14 flex-1 bg-transparent outline-none" placeholder="Search help articles" /></div></Card>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{["Credit score basics", "Billing and refunds", "Repair support"].map((item) => <Card key={item}><HelpCircle className="size-8 text-cyan-500" /><h2 className="mt-4 text-xl font-black">{item}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Curated articles and support workflows.</p></Card>)}</div>
      <Card className="mt-8 flex items-center gap-4 bg-slate-950 text-white"><MessageCircle className="size-8 text-cyan-300" /><div><h2 className="font-black">Need human help?</h2><p className="text-sm text-slate-300">Start a WhatsApp concierge conversation from Contact.</p></div></Card>
    </Section>
  );
}
