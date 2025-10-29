import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { validateRestaurantSlug } from "@/lib/validation";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restaurant Feedback",
  description: "Share your dining experience and help us improve",
  icons: {
    icon: [
      {
        rel: "icon",
        url: "/retenly-short-logo-transparent.svg",
        type: "image/svg+xml",
      },
      {
        url: "/retenly-short-logo-transparent.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/retenly-short-logo-transparent.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistrar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
