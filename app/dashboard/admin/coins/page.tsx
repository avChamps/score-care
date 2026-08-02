import type { Metadata } from "next";
import { AdminCoinsReferrals } from "@/components/dashboard/admin-coins-referrals";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Admin Coins",
  description: "SCORECARE admin referral, coin, fraud, and reward controls.",
};

export default function AdminCoinsPage() {
  return (
    <PortalShell active="coins" variant="admin">
      <PortalTopBar title="Coins & Referrals" profileHref="/profile?from=admin" />
      <PageContent>
        <AdminCoinsReferrals />
      </PageContent>
    </PortalShell>
  );
}
