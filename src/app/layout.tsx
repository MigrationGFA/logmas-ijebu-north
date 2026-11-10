
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LGA_CONFIG } from "@/config/lga.config";
import { GoogleTranslateScript } from "@/components/GoogleTranslateScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${LGA_CONFIG.identity.name} Local Government Official Website`,
    template: `%s | ${LGA_CONFIG.identity.name} Local Government Official Website`,
  },
  description: `${LGA_CONFIG.platform.fullName} for ${LGA_CONFIG.identity.fullName}`,
  // Browser and home-screen icons use the council crest, the same approach
  // as Ifo. The generic template favicon that used to sit in src/app was
  // removed: Next.js always listed it ahead of these metadata icons.
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
    shortcut: "/logo.png",
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
      <body className="min-h-full flex flex-col">
        <GoogleTranslateScript />
        <TooltipProvider delayDuration={200}>
          <Providers>{children}</Providers>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
