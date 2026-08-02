import type { Metadata } from "next";
import { ReferralsRewardsExperience } from "@/components/dashboard/referrals-rewards-experience";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Referral & Coins",
  description: "ScoreCare referral, coin wallet, rewards, and redemptions.",
};

export default function ReferralsPage() {
  return (
    <PortalShell active="rewards">
      <PortalTopBar backHref="/dashboard" title="Referral & Coins" />
      <PageContent>
        <ReferralsRewardsExperience />
      </PageContent>
    </PortalShell>
  );
}
