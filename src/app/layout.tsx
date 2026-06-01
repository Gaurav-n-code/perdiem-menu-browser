import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu Browser",
  description: "Browse our multi-location menu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen bg-stone-50">
        {children}
      </body>
    </html>
  );
}
