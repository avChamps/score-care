"use client";

import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNativeApp =
    Capacitor.isNativePlatform() ||
    (typeof window !== "undefined" &&
      (window.location.origin === "https://localhost" ||
        window.location.origin === "capacitor://localhost"));
  const isPortal =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/profile";

  if (isNativeApp || isPortal) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {/* <Navbar /> */}
      <main className="flex-1">{children}</main>
      {/* <Footer /> */}
    </>
  );
}
