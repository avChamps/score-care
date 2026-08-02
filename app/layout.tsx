import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { AppLifecycleProvider } from "@/components/layout/app-lifecycle-provider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800", "900"],
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
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
        <AppLifecycleProvider>
          <AppShell>{children}</AppShell>
        </AppLifecycleProvider>
      </body>
    </html>
  );
}
