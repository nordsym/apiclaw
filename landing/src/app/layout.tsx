import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APIClaw | APIs for Agents",
  description: "The API discovery layer for autonomous agents. Find the right API in milliseconds.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦞</text></svg>",
  },
  openGraph: {
    title: "APIClaw | APIs for Agents",
    description: "The API discovery layer for autonomous agents. Find the right API in milliseconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APIClaw | APIs for Agents",
    description: "The API discovery layer for autonomous agents.",
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
