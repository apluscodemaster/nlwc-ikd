import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salvation | NLWC Ikorodu",
  description:
    "Learn about salvation and how to give your life to Christ at The New & Living Way Church, Ikorodu.",
};

export default function SalvationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
