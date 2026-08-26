import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

// Using system font stacks (declared in globals.css as --font-inter /
// --font-mono-tech) rather than next/font/google, so the build never
// depends on a network fetch to fonts.googleapis.com at build time. Swap
// in next/font/google (or self-hosted font files via next/font/local) if
// you want pixel-exact Inter/JetBrains Mono — the visual difference on
// this system stack is minor.

export const metadata: Metadata = {
  title: "CareerIQ — Your AI Career Operating System",
  description:
    "CareerIQ connects students, recruiters and administrators through AI-assisted hiring, from resume analysis to adaptive interviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] bg-grid">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
