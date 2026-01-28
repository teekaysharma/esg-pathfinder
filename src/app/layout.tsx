import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
