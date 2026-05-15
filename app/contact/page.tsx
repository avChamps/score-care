import type { Metadata } from "next";
import { Send } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { contactCards } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact SCORECARE for credit score, report, AI analysis, and CIBIL repair support.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to a credit concierge." body="Reach SCORECARE for product questions, repair consultations, enterprise partnerships, and premium support." primary="Email us" href="mailto:care@scorecare.in">
        <div className="grid gap-4 sm:grid-cols-2">{contactCards.map((item) => <Card key={item.title}><item.icon className="size-7 text-cyan-500" /><h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{item.value}</p></Card>)}</div>
      </PageHero>
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <SectionHeader center={false} eyebrow="Message" title="Send a request" />
            <div className="grid gap-4">
              {["Name", "Email", "Phone", "Topic"].map((label) => <input key={label} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/5" placeholder={label} />)}
              <textarea className="min-h-32 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5" placeholder="How can we help?" />
              <Button><Send className="size-4" /> Send message</Button>
            </div>
          </Card>
          <Card className="grid min-h-96 place-items-center bg-slate-950 text-center text-white">
            <div><p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Map placeholder</p><h2 className="mt-4 text-3xl font-black">BKC, Mumbai</h2><p className="mt-2 text-slate-300">Premium office location and business hours module.</p></div>
          </Card>
        </div>
      </Section>
    </>
  );
}
