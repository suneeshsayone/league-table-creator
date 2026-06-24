import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple League Creator",
  description: "Create tournaments, fixtures, standings, and scorer charts."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
