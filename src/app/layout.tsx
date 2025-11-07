// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";

export const metadata = {
  title: "NLWC IKORODU Church Image Gallery",
  description: "Dynamic image gallery of joyful moments in churcch programmes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="min-h-screen max-w-6xl mx-auto p-4">
          <main className="mt-6">{children}</main>
        </div>

        {/* Footer rendered outside the centered container so it spans full viewport width */}
        <Footer />
      </body>
    </html>
  );
}
