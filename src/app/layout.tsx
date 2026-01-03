import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { BackToTop } from "@/components/shared/BackToTop";
import { PageViewTracker } from "@/components/shared/PageViewTracker";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Nerdiction - Professional Game & Hardware Reviews",
    template: "%s | Nerdiction",
  },
  description: "Die Plattform für detaillierte Hardware- und Game-Reviews für fundierte Kaufentscheidungen.",
  keywords: ["Game Reviews", "Hardware Reviews", "Gaming", "PC Hardware", "Spiele Bewertungen", "Hardware Tests"],
  authors: [{ name: "Nerdiction" }],
  creator: "Nerdiction",
  publisher: "Nerdiction",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: baseUrl,
    siteName: "Nerdiction",
    title: "Nerdiction - Professional Game & Hardware Reviews",
    description: "Die Plattform für detaillierte Hardware- und Game-Reviews für fundierte Kaufentscheidungen.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Nerdiction",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nerdiction - Professional Game & Hardware Reviews",
    description: "Die Plattform für detaillierte Hardware- und Game-Reviews für fundierte Kaufentscheidungen.",
    images: [`${baseUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: "verification-code",
    // yandex: "verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <PageViewTracker />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Zum Hauptinhalt springen
          </a>
          <Header />
          <main id="main-content" className="flex-1 container mx-auto py-8 px-4 md:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
