import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

// Premium font selection
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechBlog - Trending Tech & AI News",
  description: "Stay updated with the latest trends in technology, AI, and gadgets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}