import type { Metadata } from "next";
import { AdminDataTable } from "@/components/dashboard/admin-data-table";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "SCORECARE admin user management.",
};

export default function AdminUsersPage() {
  return (
    <PortalShell active="users" variant="admin">
      <PortalTopBar title="Users" profileHref="/profile?from=admin" />
      <PageContent>
        <AdminDataTable
          title="Users"
          description="Review registered customers, new signups, and account status from one admin workspace."
          endpoint="/admin/users"
          emptyMessage="No users found."
          exportEndpoint="/admin/users/export"
          exportFileName="admin-users"
          pageSize={20}
          serverPagination
          columns={[
            // { key: "id", label: "ID" },
            // { key: "publicId", label: "Public ID" },
            { key: "fullName", label: "Name" },
            { key: "mobileNumber", label: "Mobile" },
            { key: "panNumber", label: "PAN" },
            { key: "email", label: "Email" },
            { key: "dateOfBirth", label: "DOB", type: "date" },
            { key: "isAdmin", label: "Admin" },
            { key: "accessType", label: "Access", type: "status" },
            { key: "subscriptionStatus", label: "Subscription", type: "status" },
            { key: "subscriptionStartedAt", label: "Sub Started", type: "date" },
            { key: "subscriptionDueAt", label: "Sub Due", type: "date" },
            { key: "subscriptionEndsAt", label: "Sub Ends", type: "date" },
            { key: "creditScore", label: "Score" },
            { key: "creditScoreLastCheckedAt", label: "Score Checked", type: "datetime" },
            { key: "totalMessages", label: "Messages" },
            { key: "loans.total", label: "Loans" },
            { key: "loans.latestStatus", label: "Latest Loan", type: "status" },
            { key: "loans.latestAppliedAt", label: "Latest Applied", type: "datetime" },
            { key: "status", label: "Status", type: "status" },
            { key: "lastLoginAt", label: "Last Login", type: "datetime" },
            { key: "createdAt", label: "Created", type: "datetime" },
            { key: "updatedAt", label: "Updated", type: "datetime" },
          ]}
        />
      </PageContent>
    </PortalShell>
  );
}
