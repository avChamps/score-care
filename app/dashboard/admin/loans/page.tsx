import type { Metadata } from "next";
import { BadgeIndianRupee } from "lucide-react";
import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Loans",
  description: "SCORECARE admin loan applications and repayments.",
};

export default function AdminLoansPage() {
  return (
    <PortalShell active="loans" variant="admin">
      <PortalTopBar title="Loans" />
      <PageContent>
        <AdminSectionPlaceholder
          Icon={BadgeIndianRupee}
          title="Loans"
          description="Track applied, approved, rejected, and overdue loan workflows."
          items={["Applied loans", "Approved loans", "Rejected loans", "Upcoming overdues"]}
        />
      </PageContent>
    </PortalShell>
  );
}
