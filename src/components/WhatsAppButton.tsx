"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const WHATSAPP_LINK = "https://wa.me/2348137436770";
const WHATSAPP_LOGO =
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774367620/whatsapp-logo_n3l5rr.png";
const SHOW_DELAY_MS = 5000;

export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes whatsapp-pop-in {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="fixed left-5 bottom-5 z-50 w-14 h-14 rounded-full shadow-lg shadow-green-500/30 hover:scale-110 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 transition-all duration-300"
        style={{
          animation: "whatsapp-pop-in 0.5s ease-out both",
        }}
      >
        <Image
          src={WHATSAPP_LOGO}
          alt="WhatsApp"
          width={56}
          height={56}
          className="w-full h-full object-contain"
          unoptimized
        />
      </a>
    </>
  );
}
