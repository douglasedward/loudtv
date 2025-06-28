import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBottomNavigation } from "@/components/MobileNavigation";
import { AppProvider, OfflineIndicator } from "@/providers/AppProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoudTV - Live Streaming Platform",
  description: "Watch and stream live content on LoudTV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}
      >
        <ErrorBoundary>
          <AppProvider>
            <OfflineIndicator />
            <Header />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNavigation />
            <Toaster position="top-right" />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
