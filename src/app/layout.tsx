import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";


export const metadata: Metadata = {
  title: "ESG Pathfinder - AI-Powered ESG Compliance Platform",
  description: "Comprehensive ESG compliance platform with XBRL reporting, audit trails, and regulatory mapping.",
  keywords: ["ESG", "Compliance", "XBRL", "Audit", "Sustainability", "Regulatory"],
  authors: [{ name: "ESG Pathfinder Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ESG Pathfinder",
    description: "AI-powered ESG compliance and reporting platform",
    url: "https://localhost:3000",
    siteName: "ESG Pathfinder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ESG Pathfinder",
    description: "AI-powered ESG compliance and reporting platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
