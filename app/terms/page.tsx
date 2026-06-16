import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Terms and Conditions", description: "SCORECARE terms and conditions." };

const termsSections = [
  {
    title: "Use of ScoreCare",
    items: [
      "ScoreCare provides credit score access, credit report summaries, report analysis, repayment reminders, dispute support, and credit improvement workflows for personal financial awareness.",
      "You must provide accurate, complete, and current information, including your mobile number, PAN, name, email, and date of birth wherever required.",
      "You must use ScoreCare only for your own lawful credit profile or for a person or business you are legally authorized to represent.",
    ],
  },
  {
    title: "Credit reports and consent",
    items: [
      "By submitting your PAN and related details, you authorize ScoreCare and its service providers to verify your identity and request your credit information from authorized credit bureaus or report providers.",
      "Credit information is used to show your score, report insights, score factors, eligibility indicators, dispute workflows, and improvement recommendations.",
      "ScoreCare does not guarantee loan approval, credit card approval, score improvement, bureau correction, or any lender decision.",
    ],
  },
  {
    title: "Payments and services",
    items: [
      "Paid plans, report downloads, analysis services, and repair support are subject to the plan details shown at the time of purchase.",
      "Fees, taxes, service availability, and turnaround times may vary by plan, payment provider, bureau, lender, or third-party service provider.",
      "Refunds, if applicable, are handled according to the Refund Policy displayed on ScoreCare.",
    ],
  },
  {
    title: "User responsibilities",
    items: [
      "You are responsible for keeping your login credentials, OTPs, device, and account access secure.",
      "You must not misuse the platform, attempt unauthorized access, upload false documents, interfere with services, or violate applicable law.",
      "ScoreCare may suspend or restrict access if required for security, fraud prevention, legal compliance, or misuse investigation.",
    ],
  },
  {
    title: "Limitation",
    items: [
      "ScoreCare insights are informational and advisory in nature and should not be treated as financial, legal, tax, or lending advice.",
      "Credit data may depend on bureau records, lender reporting cycles, and third-party systems. ScoreCare is not responsible for inaccuracies originating from those sources.",
      "To the maximum extent permitted by law, ScoreCare is not liable for indirect, incidental, consequential, or loss-of-opportunity damages arising from platform use.",
    ],
  },
];

export default function TermsPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Legal" title="Terms and Conditions" body="Please read these terms before using ScoreCare credit services." />
      <Card className="mx-auto max-w-3xl space-y-8">
        {termsSections.map((section) => (
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
