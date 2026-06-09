import type { Metadata } from "next";
import { CircleHelp } from "lucide-react";
import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Help",
  description: "SCORECARE admin help and support requests.",
};

export default function AdminHelpPage() {
  return (
    <PortalShell active="help" variant="admin">
      <PortalTopBar title="Help" />
      <PageContent>
        <AdminSectionPlaceholder
          Icon={CircleHelp}
          title="Help"
          description="Manage support tickets, help-center requests, and customer assistance tasks."
          items={["Support tickets", "Help requests", "Escalations", "Resolved issues"]}
        />
      </PageContent>
    </PortalShell>
  );
}
