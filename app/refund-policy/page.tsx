import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Refund Policy", description: "SCORECARE refund policy for reports, subscriptions, and repair services." };

export default function RefundPolicyPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Legal" title="Refund Policy" body="Transparent refund rules for digital reports and advisory services." />
      <Card className="mx-auto max-w-3xl space-y-5">
        {["Digital report purchases may be non-refundable after successful generation or delivery.", "Subscription cancellations stop future renewals while preserving access through the active billing period.", "Repair service refund eligibility depends on consultation status and completed documentation work."].map((item) => <p key={item} className="leading-8 text-slate-600 dark:text-slate-300">{item}</p>)}
      </Card>
    </Section>
  );
}
