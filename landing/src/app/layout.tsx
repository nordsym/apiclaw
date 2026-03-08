import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import statsData from "@/lib/stats.json";

export const metadata: Metadata = {
  title: "APIClaw | The API Layer for AI Agents",
  description: `Agents discover and evaluate APIs via MCP. Structured data. Ranked results. ${statsData.apiCount.toLocaleString()}+ APIs across ${statsData.categoryCount}+ categories.`,
  metadataBase: new URL("https://apiclaw.nordsym.com"),
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
    description: `${statsData.apiCount.toLocaleString()}+ APIs. MCP native. Direct Call: providers self-serve their APIs for AI agents.`,
    type: "website",
    siteName: "APIClaw",
    locale: "en_US",
    images: [
      {
        url: "/api/og?v=4",
        width: 1200,
        height: 630,
        alt: "APIClaw - The API layer for AI agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APIClaw | The API Layer for AI Agents",
    description: `Agents discover and evaluate APIs via MCP. ${statsData.apiCount.toLocaleString()}+ APIs. MCP native.`,
    images: ["/api/og"],
    creator: "@nordsym",
  },
  keywords: ["API", "AI agents", "MCP", "Claude", "GPT", "autonomous agents", "API discovery", "developer tools"],
  authors: [{ name: "NordSym", url: "https://nordsym.com" }],
  robots: "index, follow",
};

// Schema.org JSON-LD
const schemaOrg = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "APIClaw",
      "url": "https://apiclaw.nordsym.com",
      "description": "The API layer for AI agents. Discover and call APIs via MCP with structured data and ranked results."
    },
    {
      "@type": "Organization",
      "name": "NordSym AB",
      "url": "https://nordsym.com"
    },
    {
      "@type": "SoftwareApplication",
      "name": "APIClaw",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Web",
      "description": "API discovery and execution layer for AI agents. 22,000+ APIs indexed. MCP native. Direct Call providers.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free tier available"
      }
    }
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body className="antialiased bg-background text-text-primary">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
