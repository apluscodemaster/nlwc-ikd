"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Re-triggers Logos RefTagger on client-side navigation.
 * RefTagger only scans the DOM on initial load, so we need to call
 * refTagger.tag() whenever the route changes in a SPA.
 */
export default function RefTaggerReloader() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to let the new page content render
    const timer = setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).refTagger?.tag
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).refTagger.tag();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
