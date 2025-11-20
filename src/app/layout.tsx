import "./globals.css";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import { Jost } from "next/font/google";

const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

export const metadata = {
  title: "NLWC IKORODU Church Image Gallery",
  description: "Dynamic image gallery of joyful moments in church programmes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning={true}>
      <body
        className="bg-gray-50 text-gray-900 font-sans overflow-x-hidden"
        suppressHydrationWarning={true}
      >
        <div className="min-h-screen max-w-6xl mx-auto p-4">
          <main className="mt-6">{children}</main>
        </div>

        <Footer />
      </body>
    </html>
  );
}
