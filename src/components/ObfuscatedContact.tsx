"use client";

import { useState, useEffect, type ReactNode } from "react";

type ContactType = "email" | "phone";

interface ObfuscatedContactProps {
  value: string;
  type: ContactType;
  className?: string;
  iconBefore?: ReactNode;
}

function encode(str: string): string {
  return btoa(
    str
      .split("")
      .map((c) => String.fromCharCode(c.charCodeAt(0) + 3))
      .join(""),
  );
}

function decode(encoded: string): string {
  return atob(encoded)
    .split("")
    .map((c) => String.fromCharCode(c.charCodeAt(0) - 3))
    .join("");
}

const ENCODED_EMAIL = encode("ikoroduchurchadmin@nlwc.church");
const ENCODED_PHONE = encode("+234 813 743 6770");
const PHONE_RAW = encode("+2348137436770");

export function useDecodedContact(type: ContactType) {
  const [decoded, setDecoded] = useState<{
    display: string;
    raw: string;
  } | null>(null);

  useEffect(() => {
    if (type === "email") {
      const val = decode(ENCODED_EMAIL);
      setDecoded({ display: val, raw: val });
    } else {
      setDecoded({
        display: decode(ENCODED_PHONE),
        raw: decode(PHONE_RAW),
      });
    }
  }, [type]);

  return decoded;
}

export default function ObfuscatedContact({
  type,
  className,
  iconBefore,
}: Omit<ObfuscatedContactProps, "value">) {
  const contact = useDecodedContact(type);

  if (!contact) {
    return (
      <span className={className}>
        {iconBefore}
        {type === "email" ? "Loading email..." : "Loading phone..."}
      </span>
    );
  }

  const href =
    type === "email" ? `mailto:${contact.raw}` : `tel:${contact.raw}`;

  return (
    <a href={href} className={className}>
      {iconBefore}
      {contact.display}
    </a>
  );
}
