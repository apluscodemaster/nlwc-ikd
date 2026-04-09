import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome | NLWC Ikorodu",
  description:
    "Welcome to The New & Living Way Church, Ikorodu! We're glad you're here. Learn about our community and what to expect.",
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
