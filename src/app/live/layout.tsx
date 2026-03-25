import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Broadcast | NLWC Ikorodu",
  description:
    "Watch the live video broadcast and recent services from The New & Living Way Church, Ikorodu.",
};

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
