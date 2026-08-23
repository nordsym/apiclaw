import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Workspace | APIClaw",
  description: "Manage your APIClaw workspace, APIs, agents, and billing",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[var(--text-muted)] animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">Loading workspace...</p>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}
