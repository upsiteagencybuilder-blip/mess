import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "মেস সেটল — Mess Management & Seat Finder",
  description: "বাংলাদেশের মেস ও সিট খুঁজুন, রিয়েল-টাইম ভ্যাকেন্সি দেখুন এবং ভাড়া-ইউটিলিটি বিল সম্পূর্ণ ডিজিটালভাবে পরিচালনা করুন।",
  keywords: ["mess", "hostel", "seat finder", "মেস", "সিট", "ভাড়া", "Bangladesh", "Dhaka"],
  authors: [{ name: "মেস সেটল" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "মেস সেটল — Mess Management & Seat Finder",
    description: "বাংলাদেশের মেস ও সিট খুঁজুন, রিয়েল-টাইম ভ্যাকেন্সি ও স্বচ্ছ বিলিং।",
    siteName: "মেস সেটল",
    type: "website",
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
        {children}
        <Toaster />
        <FirebaseAnalytics />
      </body>
    </html>
  );
}
