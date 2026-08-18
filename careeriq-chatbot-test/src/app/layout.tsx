import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerIQ Assistant — Chatbot Test Site",
  description:
    "Standalone test environment for the CareerIQ website-help chatbot module.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-blueprint min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
