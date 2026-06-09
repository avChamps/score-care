import type { Metadata } from "next";
import { ProfilePageShell } from "@/components/dashboard/profile-page-shell";

export const metadata: Metadata = {
  title: "Profile",
  description: "View your verified SCORECARE user profile.",
};

export default function ProfilePage() {
  return <ProfilePageShell />;
}
