import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media | NLWC Ikorodu",
  description:
    "Access audio messages, video broadcasts, and other media content from The New & Living Way Church, Ikorodu.",
};

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
