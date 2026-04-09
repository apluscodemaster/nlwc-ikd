import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | NLWC Ikorodu",
  description:
    "Discover who we are, what we believe, and the heart behind everything we do at The New & Living Way Church, Ikorodu.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
