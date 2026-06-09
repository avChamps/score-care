import type { Metadata } from "next";
import { Users } from "lucide-react";
import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "SCORECARE admin user management.",
};

export default function AdminUsersPage() {
  return (
    <PortalShell active="users" variant="admin">
      <PortalTopBar title="Users" />
      <PageContent>
        <AdminSectionPlaceholder
          Icon={Users}
          title="Users"
          description="Review registered customers, new signups, and account status from one admin workspace."
          items={["All users", "New users", "Active profiles", "Blocked or inactive accounts"]}
        />
      </PageContent>
    </PortalShell>
  );
}
