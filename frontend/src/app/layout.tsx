import type { Metadata } from "next";   // This is only for TypeScript checking. It will not become real JavaScript code in the browser/server bundle.
import "./(public)/globals.css";
import { JSX } from "react/jsx-dev-runtime";

export const metadata: Metadata = {
  title: "Plutus",
  description: "Private wealth management analytics platform",
  keywords: ["Net worth", "wealth", "wealth management", "AI", "portfolio", "analytics", "dashboard"],
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png", },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png", },
    ],
    apple: [{ url: "/favicon_io/apple-touch-icon.png" }],
  },
  manifest: "/favicon_io/site.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) : JSX.Element {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
