import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitEase",
  description: "A simple, easy-to-use expense splitting app",
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
