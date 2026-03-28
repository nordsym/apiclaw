import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace | APIClaw",
  description: "Manage your APIs, view analytics, and track earnings on APIClaw.",
};

export default function ProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
