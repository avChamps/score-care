import type { Metadata } from "next";
import { Download, Lock, ReceiptText } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { ComparisonTable, PricingCards } from "@/components/sections/shared";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Credit Report Plans",
  description: "Buy secure credit report plans and preview a premium SCORECARE report dashboard.",
};

export default function ReportPage() {
  return (
    <>
      <PageHero eyebrow="Reports" title="Credit reports that feel boardroom-ready." body="Choose a plan, pay securely, and receive a polished report dashboard with actionable score intelligence." primary="View plans" href="#plans">
        <Card>
          <div className="flex items-center justify-between">
            <ReceiptText className="size-10 text-cyan-500" />
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">Paid securely</span>
          </div>
          <div className="mt-8 space-y-4">
            {["Account mix", "Payment history", "Inquiries", "Dispute opportunities"].map((item, index) => (
              <div key={item} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">
                <div className="flex justify-between text-sm font-semibold"><span>{item}</span><span>{92 - index * 8}%</span></div>
                <div className="mt-3 h-2 rounded-full bg-white/70 dark:bg-slate-950/70"><div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${92 - index * 8}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </PageHero>
      <div id="plans"><PricingCards /></div>
      <Section>
        <SectionHeader eyebrow="Secure payment" title="Checkout designed for trust." />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { Icon: Lock, title: "Encrypted payments" },
            { Icon: Download, title: "Instant report access" },
            { Icon: ReceiptText, title: "GST-ready invoices" },
          ].map(({ Icon, title }) => (
            <Card key={title}><Icon className="size-8 text-cyan-500" /><h3 className="mt-4 text-xl font-bold">{title}</h3></Card>
          ))}
        </div>
      </Section>
      <ComparisonTable />
    </>
  );
}
