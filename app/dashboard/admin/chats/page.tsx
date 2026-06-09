import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Chats",
  description: "SCORECARE admin chat and message overview.",
};

export default function AdminChatsPage() {
  return (
    <PortalShell active="chats" variant="admin">
      <PortalTopBar title="Chats" />
      <PageContent>
        <AdminSectionPlaceholder
          Icon={MessageCircle}
          title="Chats"
          description="Monitor user conversations, support requests, and assistant message activity."
          items={["Open chats", "Recent messages", "Support follow-ups", "Resolved chats"]}
        />
      </PageContent>
    </PortalShell>
  );
}
