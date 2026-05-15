import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
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
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
