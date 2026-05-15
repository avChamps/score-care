import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Privacy Policy", description: "SCORECARE privacy policy for credit and financial data handling." };

export default function PrivacyPolicyPage() {
  return <Policy title="Privacy Policy" items={["We collect only the information needed to deliver credit score, report, AI analysis, and repair workflows.", "Sensitive financial data is handled with consent-led access patterns and encrypted product surfaces.", "Users can request support, correction, or deletion according to applicable law and service obligations."]} />;
}

function Policy({ title, items }: { title: string; items: string[] }) {
  return (
    <Section>
      <SectionHeader eyebrow="Legal" title={title} body="Plain-language placeholder policy content for production legal review." />
      <Card className="mx-auto max-w-3xl space-y-5">{items.map((item) => <p key={item} className="leading-8 text-slate-600 dark:text-slate-300">{item}</p>)}</Card>
    </Section>
  );
}
