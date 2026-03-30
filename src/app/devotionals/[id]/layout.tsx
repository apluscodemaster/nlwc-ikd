import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Devotional | NLWC Ikorodu",
  description:
    "Read today's daily devotional from The New & Living Way Church, Ikorodu.",
};

export default function DevotionalViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
