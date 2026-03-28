import type { Metadata } from "next";
import { Inter, Work_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Finishing Touch LLC — CRM",
  description:
    "Internal CRM platform for The Finishing Touch LLC. Manage leads, customers, and projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${workSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background">{children}</body>
    </html>
  );
}
