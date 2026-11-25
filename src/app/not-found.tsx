import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFoundContent";

// Server wrapper so the 404 can set its own title (a "use client" file can't
// export metadata, so missing pages showed the home page's title).
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return <NotFoundContent />;
}
