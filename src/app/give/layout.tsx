import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Give | NLWC Ikorodu",
  description:
    "Support the work of God at The New & Living Way Church, Ikorodu. Give your tithes, offerings, and donations.",
};

export default function GiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
