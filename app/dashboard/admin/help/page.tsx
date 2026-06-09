import type { Metadata } from "next";
import { AdminDataTable } from "@/components/dashboard/admin-data-table";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Help",
  description: "SCORECARE admin help and support requests.",
};

export default function AdminHelpPage() {
  return (
    <PortalShell active="help" variant="admin">
      <PortalTopBar title="Help" profileHref="/profile?from=admin" />
      <PageContent>
        <AdminDataTable
          title="Help"
          description="Manage support tickets, help-center requests, and customer assistance tasks."
          endpoint="/admin/help"
          emptyMessage="No help requests found."
          columns={[
            { key: "id", label: "ID" },
            { key: "user.fullName", label: "Customer" },
            { key: "category", label: "Category" },
            { key: "subject", label: "Subject" },
            { key: "status", label: "Status", type: "status" },
            { key: "createdAt", label: "Created", type: "datetime" },
          ]}
        />
      </PageContent>
    </PortalShell>
  );
}
