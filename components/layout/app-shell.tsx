"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortal = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isPortal) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
