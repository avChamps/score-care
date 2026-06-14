import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { AppErrorGuards } from "@/components/app-error-guards";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scorecare.in"),
  title: {
    default: "SCORECARE | AI Credit Score, Reports and CIBIL Repair",
    template: "%s | SCORECARE",
  },
  description:
    "Premium fintech credit intelligence platform for free credit score checks, AI report analysis, CIBIL repair services, and lender-ready financial insights.",
  keywords: ["credit score", "CIBIL repair", "AI credit report", "fintech SaaS", "SCORECARE"],
  openGraph: {
    title: "SCORECARE",
    description: "AI-powered credit intelligence and repair support.",
    url: "https://scorecare.in",
    siteName: "SCORECARE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          id="native-shell-class"
          dangerouslySetInnerHTML={{
            __html: `
            (function () {
              var origin = window.location.origin;
              if (origin === "https://localhost" || origin === "capacitor://localhost") {
                document.documentElement.classList.add("native-shell");
              }
            })();
          `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppErrorBoundary>
          <AppErrorGuards />
          <AppShell>{children}</AppShell>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
