"use client";

import { useEffect } from "react";

/**
 * Component to register and manage Service Worker
 * Add this to your root layout to enable offline support
 */
export function ServiceWorkerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register service worker only in browser and if supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.warn("Service Worker registration failed:", error);
        });
    }
  }, []);

  return <>{children}</>;
}
