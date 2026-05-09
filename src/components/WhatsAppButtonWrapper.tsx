"use client";

import { usePathname } from "next/navigation";
import WhatsAppButton from "./WhatsAppButton";

export default function WhatsAppButtonWrapper() {
  const pathname = usePathname();

  // Hide WhatsApp button on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <WhatsAppButton />;
}
