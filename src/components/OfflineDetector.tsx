"use client";

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Helper function to verify actual internet connectivity
 */
async function verifyConnectivity(): Promise<boolean> {
  try {
    const response = await fetch("/", {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok || response.type === "opaque";
  } catch (error) {
    return false;
  }
}

/**
 * Component to detect and redirect to offline page when connection is lost
 * Also handles automatic redirect back to the previous page when connection is restored
 * Wrap your app with this component to automatically handle offline scenarios
 */
export function OfflineDetector({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // If connection is lost, redirect to offline page
    if (!isOnline && window.location.pathname !== "/offline") {
      // Store the current page so we can redirect back to it when connection is restored
      sessionStorage.setItem("previousPage", window.location.pathname + window.location.search + window.location.hash);
      window.location.href = "/offline";
      return;
    }

    // If connection is restored and we're on the offline page, redirect to previous page
    if (isOnline && window.location.pathname === "/offline") {
      console.log("Connection restored, verifying connectivity...");
      verifyConnectivity().then((isConnected) => {
        if (isConnected) {
          const previousPage = sessionStorage.getItem("previousPage") || "/";
          console.log(`Connectivity verified, redirecting to ${previousPage}`);
          sessionStorage.removeItem("previousPage");
          window.location.href = previousPage;
        }
      });
    }
  }, [isOnline]);

  return <>{children}</>;
}
