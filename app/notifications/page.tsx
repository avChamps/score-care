import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Notifications",
  description: "SCORECARE notifications are available in the logged-in dashboard drawer.",
};

export default function NotificationsPage() {
  redirect("/dashboard");
}
