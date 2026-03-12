import { useEffect, useState } from "react";

/**
 * Helper function to verify actual internet connectivity via fetch
 * @returns {Promise<boolean>} true if connected, false otherwise
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
 * Hook to track and detect online/offline status with connectivity verification
 * Uses both navigator.onLine and actual fetch verification for reliability
 * @returns {boolean} true if online and connected, false if offline or no connectivity
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state based on navigator.onLine
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      // Verify actual connectivity when online event fires
      const isConnected = await verifyConnectivity();
      setIsOnline(isConnected);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

