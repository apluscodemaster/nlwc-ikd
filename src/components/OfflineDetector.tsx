"use client";

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Component to detect and redirect to offline page when connection is lost
 * Wrap your app with this component to automatically handle offline scenarios
 */
export function OfflineDetector({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Only redirect if we're in browser and connection is lost
    if (typeof window !== "undefined" && !isOnline) {
      // Check if we're not already on the offline page
      if (window.location.pathname !== "/offline") {
        window.location.href = "/offline";
      }
    }
  }, [isOnline]);

  return <>{children}</>;
}
