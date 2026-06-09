import type { Metadata } from "next";
import { AdminDataTable } from "@/components/dashboard/admin-data-table";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Loans",
  description: "SCORECARE admin loan applications and repayments.",
};

export default function AdminLoansPage() {
  return (
    <PortalShell active="loans" variant="admin">
      <PortalTopBar title="Loans" profileHref="/profile?from=admin" />
      <PageContent>
        <AdminDataTable
          title="Loans"
          description="Track applied, approved, rejected, and overdue loan workflows."
          endpoint="/admin/loans"
          emptyMessage="No loans found."
          columns={[
            { key: "id", label: "ID" },
            { key: "user.fullName", label: "Customer" },
            { key: "loanType", label: "Type" },
            { key: "amount", label: "Amount", type: "money" },
            { key: "status", label: "Status", type: "status" },
            { key: "appliedAt", label: "Applied", type: "date" },
            { key: "nextEmiDate", label: "Next EMI", type: "date" },
          ]}
        />
      </PageContent>
    </PortalShell>
  );
}
