import type { Metadata } from "next";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { ProfileDetails } from "@/components/dashboard/profile-details";

export const metadata: Metadata = {
  title: "Profile",
  description: "View your verified SCORECARE user profile.",
};

export default function ProfilePage() {
  return (
    <PortalShell active="home">
      <PortalTopBar title="Profile" backHref="/dashboard" />
      <PageContent>
        <ProfileDetails />
      </PageContent>
    </PortalShell>
  );
}
