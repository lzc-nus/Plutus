import type { Metadata } from "next";   // This is only for TypeScript checking. It will not become real JavaScript code in the browser/server bundle.
import "./globals.css";
import { JSX } from "react/jsx-dev-runtime";

export const metadata: Metadata = {
  title: "Two Sicilies",
  description: "Private wealth intelligence guided by AI.",
  keywords: ["wealth", "AI", "portfolio"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) : JSX.Element {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
