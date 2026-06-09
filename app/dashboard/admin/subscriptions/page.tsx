import type { Metadata } from "next";
import { AdminSubscriptions } from "@/components/dashboard/admin-subscriptions";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Subscriptions",
  description: "SCORECARE admin subscription updates.",
};

export default function AdminSubscriptionsPage() {
  return (
    <PortalShell active="subscriptions" variant="admin">
      <PortalTopBar title="Subscriptions" profileHref="/profile?from=admin" />
      <PageContent>
        <AdminSubscriptions />
      </PageContent>
    </PortalShell>
  );
}
