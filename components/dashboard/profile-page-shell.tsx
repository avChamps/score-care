"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { ProfileDetails } from "@/components/dashboard/profile-details";

export function ProfilePageShell() {
  return (
    <Suspense fallback={<ProfilePageContent isAdminView={false} />}>
      <ProfilePageRouteContent />
    </Suspense>
  );
}

function ProfilePageRouteContent() {
  const searchParams = useSearchParams();

  return <ProfilePageContent isAdminView={searchParams.get("from") === "admin"} />;
}

function ProfilePageContent({ isAdminView }: { isAdminView: boolean }) {
  return (
    <PortalShell active="home" variant={isAdminView ? "admin" : "user"}>
      <PortalTopBar title="Profile" backHref={isAdminView ? "/dashboard/admin" : "/dashboard"} />
      <PageContent>
        <ProfileDetails isAdminView={isAdminView} />
      </PageContent>
    </PortalShell>
  );
}
