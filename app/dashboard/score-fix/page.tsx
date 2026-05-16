import type { Metadata } from "next";
import { ScoreFixExperience } from "./score-fix-experience";

export const metadata: Metadata = {
  title: "Score Fix",
  description: "Manage CIBIL score fix requests, dispute details, timelines, and new score repair submissions.",
};

export default function ScoreFixPage() {
  return <ScoreFixExperience />;
}
