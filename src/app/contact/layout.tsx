import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | NLWC Ikorodu",
  description:
    "Get in touch with The New & Living Way Church, Ikorodu. Find our address, service times, and ways to connect with us.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
