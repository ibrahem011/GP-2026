import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "./providers";
import IOSInstallPrompt from "@/components/IOSInstallPrompt";
import ChromeGate from "@/components/chrome/ChromeGate";

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gamasa-properties.vercel.app'),
  title: "عقارات جمصة | إيجار شقق وغرف في مصيف جمصة",
  description: "منصة تأجير العقارات الأولى في جمصة - شقق، غرف، فيلات للإيجار بأسعار مناسبة. احجز مصيفك الآن!",
  keywords: ["إيجار شقق جمصة", "مصيف جمصة", "شقق رخيصة بجمصة", "عقارات جمصة", "إيجار غرف جمصة"],
  authors: [{ name: "عقارات جمصة" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "عقارات جمصة",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://gamasa-properties.vercel.app",
    siteName: "عقارات جمصة",
    title: "عقارات جمصة | إيجار شقق وغرف في مصيف جمصة",
    description: "منصة تأجير العقارات الأولى في جمصة",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "عقارات جمصة",
      },
    ],
  },
  verification: {
    google: "YOUR_VERIFICATION_CODE",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${notoSansArabic.variable} ${inter.variable} font-sans antialiased`}>
        <Providers>
          <ChromeGate>
            {children}
          </ChromeGate>
          <IOSInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
