import type { Metadata, Viewport } from "next";
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
  description:
    "বাংলাদেশের মেস ও সিট খুঁজুন, রিয়েল-টাইম ভ্যাকেন্সি দেখুন এবং ভাড়া-ইউটিলিটি বিল সম্পূর্ণ ডিজিটালভাবে পরিচালনা করুন।",
  keywords: [
    "mess",
    "hostel",
    "seat finder",
    "মেস",
    "সিট",
    "ভাড়া",
    "Bangladesh",
    "Rajshahi",
  ],
  authors: [{ name: "মেস সেটল" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "মেস সেটল",
  },
  openGraph: {
    title: "মেস সেটল — Mess Management & Seat Finder",
    description:
      "বাংলাদেশের মেস ও সিট খুঁজুন, রিয়েল-টাইম ভ্যাকেন্সি ও স্বচ্ছ বিলিং।",
    siteName: "মেস সেটল",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// Register service worker for PWA
const SW_SCRIPT = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
      </head>
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
