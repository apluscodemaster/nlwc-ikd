import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery | NLWC Ikorodu",
  description:
    "Browse photos and memories from services, events, and special moments at The New & Living Way Church, Ikorodu.",
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
