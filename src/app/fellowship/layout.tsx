import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fellowship Centres | NLWC Ikorodu",
  description:
    "Find a New & Living Way Church fellowship centre near you in Ikorodu and surrounding areas.",
};

export default function FellowshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
