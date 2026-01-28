import "./globals.css";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Jost } from "next/font/google";
import Providers from "@/components/Providers";

const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

export const metadata = {
  title: "The New & Living Way Church | Ikorodu, Lagos",
  description:
    "Welcome to The New & Living Way Church, a community of faith, hope, and love in Ikorodu, Lagos. Join us for a life-transforming experience.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning={true}>
      <body
        className="bg-gray-50 text-gray-900 font-sans overflow-x-hidden min-h-screen flex flex-col"
        suppressHydrationWarning={true}
      >
        <Providers>
          <Navbar />
          <main className="flex-grow pt-16">{children}</main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
