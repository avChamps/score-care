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
  type LucideIcon,
  Zap,
} from "lucide-react";
import { AppCard, PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bill Payments",
  description: "Bill payment categories for credit cards, utilities, travel, housing, and society payments.",
};

const iconTones = {
  blue: "border-blue-100 bg-blue-50 text-blue-600",
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-600",
  green: "border-emerald-100 bg-emerald-50 text-emerald-600",
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-600",
  lime: "border-lime-100 bg-lime-50 text-lime-700",
  orange: "border-orange-100 bg-orange-50 text-orange-600",
  red: "border-rose-100 bg-rose-50 text-rose-600",
  sky: "border-sky-100 bg-sky-50 text-sky-600",
  violet: "border-violet-100 bg-violet-50 text-violet-600",
  yellow: "border-amber-100 bg-amber-50 text-amber-600",
} as const;

type IconTone = keyof typeof iconTones;
type PaymentSectionData = {
  title: string;
  items: Array<{
    label: string;
    Icon: LucideIcon;
    tone: IconTone;
  }>;
};

const sections: PaymentSectionData[] = [
  {
    title: "Suggested for you",
    items: [
      { label: "Credit Card Bill", Icon: CreditCard, tone: "blue" },
      { label: "Loan Repayment", Icon: Landmark, tone: "indigo" },
      { label: "Insurance", Icon: ShieldCheck, tone: "orange" },
      { label: "Mobile Recharge", Icon: Smartphone, tone: "green" },
      { label: "Electricity", Icon: Lightbulb, tone: "yellow" },
      { label: "DTH", Icon: RadioTower, tone: "violet" },
      { label: "FASTag", Icon: Car, tone: "red" },
      { label: "Broadband postpaid", Icon: Factory, tone: "cyan" },
    ],
  },
  {
    title: "Utilities",
    items: [
      { label: "Gas", Icon: Fuel, tone: "orange" },
      { label: "Water", Icon: Droplets, tone: "sky" },
      { label: "Prepaid Meter", Icon: Plug, tone: "yellow" },
      { label: "Mobile postpaid", Icon: Smartphone, tone: "green" },
    ],
  },
  {
    title: "Travel",
    items: [
      { label: "Metro Recharge", Icon: Train, tone: "blue" },
      { label: "EV Recharge", Icon: Zap, tone: "lime" },
      { label: "Fleet Card Recharge", Icon: BadgeIndianRupee, tone: "red" },
      { label: "NCMC Recharge", Icon: Building2, tone: "indigo" },
    ],
  },
  {
    title: "Housing & Society",
    items: [
      { label: "Housing society", Icon: Home, tone: "green" },
      { label: "Municipal services", Icon: Zap, tone: "yellow" },
      { label: "Rental", Icon: Home, tone: "orange" },
      { label: "Municipal Taxes", Icon: Landmark, tone: "indigo" },
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
            <div className="absolute inset-y-0 left-0 w-1 bg-[var(--portal-blue)]" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-cyan-600">Payments hub</p>
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

function PaymentSection({ section }: { section: PaymentSectionData }) {
  return (
    <section>
      <h2 className="text-sm font-bold tracking-tight text-slate-950">{section.title}</h2>
      <div className="mt-3 grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {section.items.map(({ Icon, label, tone }) => (
          <button key={label} className="group min-w-0 text-center" type="button">
            <span className="mx-auto grid aspect-square w-full max-w-[4.25rem] place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 group-hover:border-slate-300">
              <span className={cn("grid size-9 place-items-center rounded-xl border", iconTones[tone])}>
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
            </span>
            <span className="mx-auto mt-1.5 block max-w-[4.8rem] text-[12px] font-semibold leading-tight text-slate-600">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
