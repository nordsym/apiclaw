import { Suspense } from "react";

export const metadata = {
  title: "Dashboard | APIClaw",
  description: "Manage your AI agents and view API usage analytics",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
