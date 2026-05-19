"use client";

import { ReactNode } from "react";

const STORAGE_KEY = "backToListUrl";

/**
 * Call this from list pages to store the current URL (with pagination params)
 * so the detail page's back button can return to the correct page.
 */
export function storeListUrl(key: string, path: string) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(`${STORAGE_KEY}:${key}`, path);
  }
}

interface BackToListLinkProps {
  fallbackHref: string;
  /** Must match the key used with storeListUrl (e.g. "manuals", "transcripts") */
  storageKey: string;
  children: ReactNode;
  className?: string;
}

export default function BackToListLink({
  fallbackHref,
  storageKey,
  children,
  className,
}: BackToListLinkProps) {
  const handleClick = () => {
    let url = fallbackHref;
    if (typeof sessionStorage !== "undefined") {
      const stored = sessionStorage.getItem(`${STORAGE_KEY}:${storageKey}`);
      if (stored) {
        url = stored;
      }
    }
    window.location.href = url;
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
