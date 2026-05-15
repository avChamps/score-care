import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageContent, PortalShell, PortalTopBar, SectionTitle, UtilityTile } from "@/components/dashboard/portal-ui";
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
  Smartphone,
  Train,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Bill Payments",
  description: "Bill payment categories for credit cards, utilities, travel, housing, and society payments.",
};

export default function BillPaymentsPage() {
  return (
    <PortalShell active="bills">
      <PortalTopBar title="Bill Payments" backHref="/dashboard" />
      <PageContent>
        <SectionTitle>Suggested for you</SectionTitle>
        <UtilityGrid
          items={[
            [<CreditCard key="credit" className="size-8" />, "Credit Card Bill"],
            [<Landmark key="loan" className="size-8" />, "Loan Repayment"],
            [<PlusIcon key="insurance" />, "Insurance"],
            [<Smartphone key="mobile" className="size-8" />, "Mobile Recharge"],
            [<Lightbulb key="electricity" className="size-8" />, "Electricity"],
            [<RadioTower key="dth" className="size-8" />, "DTH"],
            [<Car key="fastag" className="size-8" />, "FASTag"],
            [<Factory key="broadband" className="size-8" />, "Broadband postpaid"],
          ]}
        />

        <SectionTitle>Utilities</SectionTitle>
        <UtilityGrid
          items={[
            [<Fuel key="gas" className="size-8" />, "Gas"],
            [<Droplets key="water" className="size-8" />, "Water"],
            [<Plug key="meter" className="size-8" />, "Prepaid Meter"],
            [<Smartphone key="postpaid" className="size-8" />, "Mobile postpaid"],
          ]}
        />

        <SectionTitle>Travel</SectionTitle>
        <UtilityGrid
          items={[
            [<Train key="metro" className="size-8" />, "Metro Recharge"],
            [<Zap key="ev" className="size-8" />, "EV Recharge"],
            [<BadgeIndianRupee key="fleet" className="size-8" />, "Fleet Card Recharge"],
            [<Building2 key="ncmc" className="size-8" />, "NCMC Recharge"],
          ]}
        />

        <SectionTitle>Housing & Society</SectionTitle>
        <UtilityGrid
          items={[
            [<Home key="rent" className="size-8" />, "Rent"],
            [<Zap key="maintenance" className="size-8" />, "Maintenance"],
            [<Home key="society" className="size-8" />, "Society"],
            [<Landmark key="municipal" className="size-8" />, "Municipal"],
          ]}
        />
      </PageContent>
    </PortalShell>
  );
}

function UtilityGrid({ items }: { items: Array<[ReactNode, string]> }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map(([icon, label]) => (
        <UtilityTile key={label} icon={icon} label={label} />
      ))}
    </div>
  );
}

function PlusIcon() {
  return <span className="text-3xl font-bold">+</span>;
}
