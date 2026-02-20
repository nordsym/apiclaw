import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APIClaw | The API Layer for AI Agents",
  description: "Agents discover and evaluate APIs via MCP. Structured data. Ranked results. 1,400+ APIs across 52 categories.",
  metadataBase: new URL("https://apiclaw.com"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "APIClaw | The API Layer for AI Agents",
    description: "Agents discover and evaluate APIs via MCP. Structured data. Ranked results. No more googling.",
    type: "website",
    siteName: "APIClaw",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "APIClaw - The API layer for AI agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APIClaw | The API Layer for AI Agents",
    description: "Agents discover and evaluate APIs via MCP. 1,400+ APIs. MCP native.",
    images: ["/og-image.png"],
    creator: "@nordsym",
  },
  keywords: ["API", "AI agents", "MCP", "Claude", "GPT", "autonomous agents", "API discovery", "developer tools"],
  authors: [{ name: "NordSym", url: "https://nordsym.com" }],
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ef4444" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
