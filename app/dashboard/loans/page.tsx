import type { Metadata } from "next";
import { LoansExperience } from "./loans-experience";

export const metadata: Metadata = {
  title: "Loan Repayments",
  description: "Manage loans, EMI repayments, active accounts, overdue alerts, and new loan applications.",
};

export default function DashboardLoansPage() {
  return <LoansExperience />;
}
