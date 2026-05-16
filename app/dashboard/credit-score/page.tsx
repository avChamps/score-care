import type { Metadata } from "next";
import { CreditScoreExperience } from "./credit-score-experience";

export const metadata: Metadata = {
  title: "Credit Score",
  description: "View CIBIL score details, credit behaviour, and score predictor actions.",
};

export default function DashboardCreditScorePage() {
  return <CreditScoreExperience />;
}
