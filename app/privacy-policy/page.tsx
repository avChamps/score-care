import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Privacy Policy", description: "SCORECARE privacy policy for credit and financial data handling." };

const privacySections = [
  {
    title: "Information we collect",
    items: [
      "Identity and contact details such as name, mobile number, email address, date of birth, PAN, and account login information.",
      "Credit and financial information received with your consent, including credit score, report data, account summaries, enquiries, repayment behaviour, dispute details, and report documents.",
      "Usage, app interaction, device, diagnostics, crash logs, ANR information, payment status, and support information needed to operate, secure, and improve ScoreCare.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "To verify your identity, fetch or display credit information, provide report analysis, generate insights, support dispute or score repair workflows, and manage subscriptions.",
      "To send OTPs, service messages, payment updates, support responses, security alerts, and legally required notices.",
      "To measure app performance, understand safe feature usage, diagnose crashes and errors, and improve reliability without sending PAN, credit score, report details, mobile number, email, date of birth, full name, or sensitive financial data to analytics.",
      "To prevent fraud, protect the platform, comply with applicable law, resolve disputes, and enforce our terms.",
    ],
  },
  {
    title: "Sharing and processors",
    items: [
      "We may share required information with credit bureaus, authorized report providers, payment processors, cloud and security providers, communication vendors, support tools, legal advisors, and regulators where necessary.",
      "We do not sell your PAN, credit report, or personal information.",
      "Third-party processors are expected to handle data only for authorized service, security, compliance, or legal purposes.",
    ],
  },
  {
    title: "Security and retention",
    items: [
      "We use reasonable administrative, technical, and organizational safeguards designed to protect personal and credit information.",
      "We retain information for as long as needed to provide services, meet legal or audit obligations, prevent fraud, resolve disputes, and maintain business records.",
      "When information is no longer required, we delete, de-identify, or restrict it according to applicable law and operational requirements.",
    ],
  },
  {
    title: "Your choices",
    items: [
      "You may request access, correction, deletion, or withdrawal of consent by contacting ScoreCare support, subject to identity verification, legal obligations, and service limitations.",
      "Withdrawing credit report consent may limit or disable score checks, report refreshes, recommendations, and dispute support features.",
      "You can contact us at care@scorecare.in for privacy requests or questions.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return <Policy title="Privacy Policy" sections={privacySections} />;
}

function Policy({ title, sections }: { title: string; sections: typeof privacySections }) {
  return (
    <Section>
      <SectionHeader eyebrow="Legal" title={title} body="How ScoreCare collects, uses, shares, and protects personal and credit information." />
      <Card className="mx-auto max-w-3xl space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xl font-black text-[#2d2119]">{section.title}</h3>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-slate-600 dark:text-slate-700">
              {section.items.map((item) => (
                <li key={item} className="leading-8">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
    </Section>
  );
}
