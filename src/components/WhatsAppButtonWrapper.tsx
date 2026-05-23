"use client";

import { usePathname } from "next/navigation";
import WhatsAppButton from "./WhatsAppButton";

export default function WhatsAppButtonWrapper() {
  const pathname = usePathname();

  // Hide WhatsApp button on admin and quiz pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/sermons/quiz")) {
    return null;
  }

  return <WhatsAppButton />;
}
