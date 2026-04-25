import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "ReasonLab — Reasoning-First JEE Practice",
    template: "%s | ReasonLab",
  },
  description:
    "Practice JEE questions with dual solutions: the ideal approach and the shortcut. Track progress, fix weak areas, and think smarter.",
  keywords: [
    "JEE preparation",
    "JEE practice",
    "JEE shortcuts",
    "JEE Mains",
    "JEE Advanced",
    "reasoning",
    "IIT JEE",
  ],
  openGraph: {
    title: "ReasonLab — Think Smarter for JEE",
    description:
      "Every question teaches you the textbook solution AND the shortcut.",
    type: "website",
    siteName: "ReasonLab",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReasonLab — Think Smarter for JEE",
    description:
      "Every question teaches you the textbook solution AND the shortcut.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geistSans.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
