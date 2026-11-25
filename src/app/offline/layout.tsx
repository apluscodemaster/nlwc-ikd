import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description:
    "You are currently offline. Please check your internet connection.",
  robots: { index: false, follow: false },
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
