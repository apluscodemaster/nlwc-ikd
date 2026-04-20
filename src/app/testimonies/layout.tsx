import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimonies | NLWC Ikorodu",
  description:
    "Share your testimony of God's faithfulness and read inspiring stories from the NLWC Ikorodu community. Submit your own testimony and be a blessing to others.",
  openGraph: {
    title: "Testimonies | NLWC Ikorodu",
    description:
      "Share your testimony of God's faithfulness and read inspiring God's faithfulness from the NLWC Ikorodu community.",
    type: "website",
  },
};

export default function TestimoniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
