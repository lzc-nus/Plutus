import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plutus",
  description: "Private wealth management analytics platform",
  keywords: ["Net worth", "wealth", "wealth management", "AI", "portfolio", "analytics", "dashboard"],
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png", },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png", },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png" }],
  },
  manifest: "/favicons/site.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
