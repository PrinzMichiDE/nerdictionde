import type { Metadata } from "next";
import { WorkspaceBar } from "./components/WorkspaceBar";
import { AdminReviewsProvider } from "./reviews-store";

export const metadata: Metadata = {
  title: "Redaktion",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminReviewsProvider>
      <div className="min-h-screen bg-background">
        <WorkspaceBar />
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 md:py-8">
          {children}
        </div>
      </div>
    </AdminReviewsProvider>
  );
}
