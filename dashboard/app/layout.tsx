import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVE Dashboard",
  description: "CVE Alert Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
