import type { Metadata } from "next";
import { HomeDashboard } from "./home-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Logged-in SCORECARE app home with credit bureau score, insights, and quick actions.",
};

export default function DashboardPage() {
  return <HomeDashboard />;
}
