import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Terms and Conditions", description: "SCORECARE terms and conditions." };

export default function TermsPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Legal" title="Terms and Conditions" body="Terms placeholder for subscription, advisory, and platform usage." />
      <Card className="mx-auto max-w-3xl space-y-5">
        {["SCORECARE provides credit education, analytics, report organization, and repair support workflows.", "Platform insights are informational and do not guarantee lender approval.", "Users are responsible for accurate information and authorized use of submitted documents."].map((item) => <p key={item} className="leading-8 text-slate-600 dark:text-slate-300">{item}</p>)}
      </Card>
    </Section>
  );
}
