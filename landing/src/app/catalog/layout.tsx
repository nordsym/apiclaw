import type { Metadata } from "next";
import statsData from "@/lib/stats.json";

const categoryCount = Object.keys(statsData.categoryBreakdown).length;

export const metadata: Metadata = {
  title: "API Catalog | APIClaw",
  description: `Browse ${statsData.apiCount.toLocaleString()}+ APIs across ${categoryCount} categories. ${statsData.sourceVerifiedCount.toLocaleString()}+ source-verified definitions, with managed execution readiness shown separately.`,
  openGraph: {
    title: "API Catalog | APIClaw",
    description: `Browse ${statsData.apiCount.toLocaleString()}+ APIs across ${categoryCount} categories. ${statsData.sourceVerifiedCount.toLocaleString()}+ source-verified definitions.`,
    type: "website",
    siteName: "APIClaw",
    locale: "en_US",
    url: "https://apiclaw.cloud/catalog",
    images: [
      {
        url: "/api/og/catalog",
        width: 1200,
        height: 630,
        alt: `APIClaw API Catalog - ${statsData.apiCount.toLocaleString()}+ APIs across ${categoryCount} categories`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "API Catalog | APIClaw",
    description: `Browse ${statsData.apiCount.toLocaleString()}+ APIs across ${categoryCount} categories. ${statsData.sourceVerifiedCount.toLocaleString()}+ source-verified definitions, with managed execution readiness shown separately.`,
    images: ["/api/og/catalog"],
    creator: "@nordsym",
  },
  alternates: {
    canonical: "https://apiclaw.cloud/catalog",
  },
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
