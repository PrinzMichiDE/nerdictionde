"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/shared/BackToTop";
import { SupportTopBanner } from "@/components/shared/SupportTopBanner";
import { SupportBanner } from "@/components/shared/SupportBanner";
import { ReadingProgressBar } from "@/components/shared/ScrollFeatures";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Toaster } from "@/components/ui/toaster";

/**
 * Renders the marketing chrome (header, banners, footer, effects) on
 * public pages only. Under /admin the screen keeps a clean shell.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {!isAdmin && (
        <>
          <ReadingProgressBar />
          <SupportTopBanner />
          <Header />
          <div className="page-noise noise" aria-hidden="true" />
        </>
      )}
      <main
        id="main-content"
        className={
          isAdmin
            ? "flex-1"
            : "flex-1 container mx-auto py-8 md:py-12 lg:py-16 px-4 md:px-6 lg:px-8 xl:px-12 max-w-7xl scroll-mt-24 pb-20 md:pb-8"
        }
      >
        {children}
      </main>
      {!isAdmin && (
        <>
          <Footer />
          <BackToTop />
          <SupportBanner />
          <InstallPrompt />
          <MobileBottomNav />
        </>
      )}
      <Toaster />
    </>
  );
}
