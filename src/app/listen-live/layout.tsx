import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listen Live | NLWC Ikorodu",
  description:
    "Listen to the live audio broadcast of services at The New & Living Way Church, Ikorodu.",
};

export default function ListenLiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
