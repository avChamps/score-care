import type { Metadata } from "next";
import { DisputeCentreExperience } from "./dispute-centre-experience";

export const metadata: Metadata = {
  title: "Dispute Centre",
  description: "Track active and resolved credit report disputes.",
};

export default function DisputeCentrePage() {
  return <DisputeCentreExperience />;
}
