import { DashboardPushNotifications } from "@/components/dashboard/dashboard-push-notifications";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardPushNotifications />
      {children}
    </>
  );
}
