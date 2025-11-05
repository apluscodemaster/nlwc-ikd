// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "NLWC IKORODU Church Image Gallery",
  description: "Dynamic image gallery of joyful moments in churcch programmes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="min-h-screen max-w-6xl mx-auto p-4">
          <header className="py-4">
            <h1 className="text-2xl font-semibold">Dynamic Image Gallery</h1>
            <p className="text-sm text-gray-600">
              Data from Google Sheets — grouped by date.
            </p>
          </header>

          <main className="mt-6">{children}</main>

          <footer className="mt-10 text-center text-sm text-gray-500">
            Built with Next.js + TypeScript + Tailwind
          </footer>
        </div>
      </body>
    </html>
  );
}
