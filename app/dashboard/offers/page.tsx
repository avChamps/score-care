import type { Metadata } from "next";
import { OffersExperience } from "./offers-experience";

export const metadata: Metadata = {
  title: "Offers",
  description: "Upcoming personalized credit offers.",
};

export default function DashboardOffersPage() {
  return <OffersExperience />;
}
