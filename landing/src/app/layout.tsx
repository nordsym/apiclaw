import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APIClaw | APIs for Agents",
  description: "Agents discover, evaluate, and purchase API access directly. No dashboards. No signups. Just APIs.",
  openGraph: {
    title: "APIClaw | APIs for Agents",
    description: "Agents discover, evaluate, and purchase API access directly. No dashboards. No signups. Just APIs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APIClaw | APIs for Agents",
    description: "Agents discover, evaluate, and purchase API access directly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
