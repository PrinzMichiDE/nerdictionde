import type { Metadata } from "next";
import { Public_Sans, Libre_Bodoni } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { BackToTop } from "@/components/shared/BackToTop";
import { SupportTopBanner } from "@/components/shared/SupportTopBanner";
import { SupportBanner } from "@/components/shared/SupportBanner";
import { ReadingProgressBar } from "@/components/shared/ScrollFeatures";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const libreBodoni = Libre_Bodoni({
  variable: "--font-libre-bodoni",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nerdiction - Professional Game & Hardware Reviews",
  description: "Die Plattform für detaillierte Hardware- und Game-Reviews für fundierte Kaufentscheidungen.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${publicSans.variable} ${libreBodoni.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ReadingProgressBar />
          <SupportTopBanner />
          <Header />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
          >
            Zum Inhalt springen
          </a>
          <main
            id="main-content"
            className="flex-1 container mx-auto py-8 md:py-12 lg:py-16 px-4 md:px-6 lg:px-8 xl:px-12 max-w-7xl scroll-mt-24"
          >
            {children}
          </main>
          <Footer />
          <BackToTop />
          <SupportBanner />
        </ThemeProvider>
        <Analytics />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G2MC0LJ614"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G2MC0LJ614');
          `}
        </Script>
      </body>
    </html>
  );
}
