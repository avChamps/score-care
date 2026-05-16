import type { Metadata } from "next";
import {
  BadgeIndianRupee,
  Building2,
  Car,
  CreditCard,
  Droplets,
  Factory,
  Fuel,
  Home,
  Landmark,
  Lightbulb,
  Plug,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Train,
  Zap,
} from "lucide-react";
import { AppCard, PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Bill Payments",
  description: "Bill payment categories for credit cards, utilities, travel, housing, and society payments.",
};

const sections = [
  {
    title: "Suggested for you",
    items: [
      { label: "Credit Card Bill", Icon: CreditCard },
      { label: "Loan Repayment", Icon: Landmark },
      { label: "Insurance", Icon: ShieldCheck },
      { label: "Mobile Recharge", Icon: Smartphone },
      { label: "Electricity", Icon: Lightbulb },
      { label: "DTH", Icon: RadioTower },
      { label: "FASTag", Icon: Car },
      { label: "Broadband postpaid", Icon: Factory },
    ],
  },
  {
    title: "Utilities",
    items: [
      { label: "Gas", Icon: Fuel },
      { label: "Water", Icon: Droplets },
      { label: "Prepaid Meter", Icon: Plug },
      { label: "Mobile postpaid", Icon: Smartphone },
    ],
  },
  {
    title: "Travel",
    items: [
      { label: "Metro Recharge", Icon: Train },
      { label: "EV Recharge", Icon: Zap },
      { label: "Fleet Card Recharge", Icon: BadgeIndianRupee },
      { label: "NCMC Recharge", Icon: Building2 },
    ],
  },
  {
    title: "Housing & Society",
    items: [
      { label: "Housing society", Icon: Home },
      { label: "Municipal services", Icon: Zap },
      { label: "Rental", Icon: Home },
      { label: "Municipal Taxes", Icon: Landmark },
    ],
  },
];

export default function BillPaymentsPage() {
  return (
    <PortalShell active="bills">
      <PortalTopBar title="Bill Payments" />
      <PageContent>
        <div className="space-y-6 animate-[creditPanelIn_0.42s_ease-out]">
          <AppCard className="relative overflow-hidden p-4">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-600 to-cyan-500" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan-600">Payments hub</p>
                <h2 className="mt-1 text-base font-bold tracking-tight text-slate-950">Pay bills and recharge</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Choose a service category to continue with secure payments.</p>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                <CreditCard className="size-5" />
              </span>
            </div>
          </AppCard>

          {sections.map((section) => (
            <PaymentSection key={section.title} section={section} />
          ))}
        </div>
      </PageContent>
    </PortalShell>
  );
}

function PaymentSection({ section }: { section: (typeof sections)[number] }) {
  return (
    <section>
      <h2 className="text-sm font-bold tracking-tight text-slate-950">{section.title}</h2>
      <div className="mt-3 grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {section.items.map(({ Icon, label }) => (
          <button key={label} className="group min-w-0 text-center" type="button">
            <span className="mx-auto grid aspect-square w-full max-w-[4.25rem] place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:border-cyan-300 group-hover:bg-cyan-50 group-hover:shadow-[0_10px_24px_rgba(37,99,235,0.1)]">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-cyan-700 transition group-hover:bg-white">
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
            </span>
            <span className="mx-auto mt-1.5 block max-w-[4.8rem] text-[0.62rem] font-semibold leading-tight text-slate-600">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
