import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";
import statsData from "@/lib/stats.json";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const metadata: Metadata = {
  title: "APIClaw — The Control Plane for AI Agents | MCP · CLI · HTTP · Grok",
  description: `Terminal-native execution for AI agents. Parallel missions, real observability, and one unified control plane across MCP, CLI, HTTP, and Grok. ${statsData.sourceVerifiedCount.toLocaleString()} source-verified API definitions across ${Object.keys(statsData.categoryBreakdown).length} categories.`,
  metadataBase: new URL("https://apiclaw.cloud"),
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
    title: "APIClaw — The Control Plane for AI Agents | MCP · CLI · HTTP · Grok",
    description: `Terminal-native execution for AI agents. Parallel missions, real observability, and one unified control plane across MCP, CLI, HTTP, and Grok. ${statsData.sourceVerifiedCount.toLocaleString()} source-verified API definitions across ${Object.keys(statsData.categoryBreakdown).length} categories.`,
    type: "website",
    siteName: "APIClaw",
    locale: "en_US",
    images: [
      {
        url: "/api/og?v=6",
        width: 1200,
        height: 630,
        alt: "APIClaw — The Control Plane for AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APIClaw — The Control Plane for AI Agents | MCP · CLI · HTTP · Grok",
    description: `Terminal-native execution for AI agents. Parallel missions, real observability, and one unified control plane across MCP, CLI, HTTP, and Grok. ${statsData.sourceVerifiedCount.toLocaleString()} source-verified API definitions across ${Object.keys(statsData.categoryBreakdown).length} categories.`,
    images: ["/api/og?v=6"],
    creator: "@nordsym",
  },
  keywords: ["control plane", "AI agents", "agent runtime", "MCP", "Grok", "Claude", "missions", "observability", "API gateway", "autonomous agents", "API discovery", "developer tools"],
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
      "url": "https://apiclaw.cloud",
      "description": `The control plane for AI agents. ${statsData.sourceVerifiedCount.toLocaleString()} source-verified API definitions across ${Object.keys(statsData.categoryBreakdown).length} categories. MCP, CLI, HTTP, and Grok-ready.`
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
      "description": `The control plane for AI agents. Terminal-native execution, parallel missions, and real observability across ${statsData.sourceVerifiedCount.toLocaleString()} source-verified API definitions and ${statsData.capabilityCount} capability categories.`,
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0b0b0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
        <script
          defer
          src="https://analytics.nordsym.com/script.js"
          data-website-id="593e90e2-9573-4b01-928b-b5a24050489e"
        />
      </head>
      <body className="antialiased bg-background text-text-primary">
        {CLERK_ENABLED ? (
          <ClerkProvider
            afterSignOutUrl="/api/workspace-auth/clerk-signout"
            signInFallbackRedirectUrl="/api/workspace-auth/clerk-bridge"
            signUpFallbackRedirectUrl="/api/workspace-auth/clerk-bridge"
          >
            <PostHogProvider>{children}</PostHogProvider>
          </ClerkProvider>
        ) : (
          <PostHogProvider>{children}</PostHogProvider>
        )}
        <Analytics />
      </body>
    </html>
  );
}
