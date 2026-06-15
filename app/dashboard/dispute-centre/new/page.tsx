import type { Metadata } from "next";
import { NewDisputeExperience } from "./new-dispute-experience";

export const metadata: Metadata = {
  title: "Raise Dispute",
  description: "File a credit report dispute.",
};

export default function NewDisputePage() {
  return <NewDisputeExperience />;
}
