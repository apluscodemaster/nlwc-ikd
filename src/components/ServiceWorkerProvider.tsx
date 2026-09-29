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
        .then((registration) => {
          // Explicitly check for a newer worker on load. Without this a visitor
          // keeps whatever version their browser cached until it decides to
          // re-check on its own, so a fix shipped in sw.js (e.g. no longer
          // intercepting audio range requests) can take days to reach them.
          // The worker calls skipWaiting()/clients.claim(), so a new version
          // takes over on the next navigation.
          registration.update().catch(() => {
            // Offline or the check failed — the existing worker keeps serving.
          });
        })
        .catch((error) => {
          console.warn("Service Worker registration failed:", error);
        });
    }
  }, []);

  return <>{children}</>;
}
