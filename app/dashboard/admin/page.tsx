import type { Metadata } from "next";
import { AdminHome } from "@/components/dashboard/admin-home";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "SCORECARE admin analytics for users, subscriptions, loans, overdues, and messages.",
};

export default function AdminDashboardPage() {
  return (
    <PortalShell active="home" variant="admin">
      <PortalTopBar title="Admin View" profileHref="/profile?from=admin" />
      <PageContent>
        <AdminHome />
      </PageContent>
    </PortalShell>
  );
}
