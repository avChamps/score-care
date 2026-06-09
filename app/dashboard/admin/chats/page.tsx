import type { Metadata } from "next";
import { AdminDataTable } from "@/components/dashboard/admin-data-table";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Chats",
  description: "SCORECARE admin chat and message overview.",
};

export default function AdminChatsPage() {
  return (
    <PortalShell active="chats" variant="admin">
      <PortalTopBar title="Chats" profileHref="/profile?from=admin" />
      <PageContent>
        <AdminDataTable
          title="Chats"
          description="Monitor user conversations, support requests, and assistant message activity."
          endpoint="/admin/chats"
          emptyMessage="No chats found."
          columns={[
            { key: "id", label: "ID" },
            { key: "user.fullName", label: "Customer" },
            { key: "subject", label: "Subject" },
            { key: "lastMessage", label: "Last Message" },
            { key: "status", label: "Status", type: "status" },
            { key: "lastMessageAt", label: "Last Activity", type: "datetime" },
          ]}
        />
      </PageContent>
    </PortalShell>
  );
}
