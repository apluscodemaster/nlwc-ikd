"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Wifi, WifiOff } from "lucide-react";

/**
 * Example Component - Shows different content based on online/offline status
 * Use this as a reference for implementing offline-aware features in your app
 */
export function OfflineAwareExample() {
  const isOnline = useOnlineStatus();

  return (
    <div className="space-y-4">
      {/* Example 1: Simple Status Display */}
      <div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-600" />
            <span className="text-red-700 font-medium">Offline</span>
          </>
        )}
      </div>

      {/* Example 2: Conditional Content */}
      <div className="p-4 border rounded-lg">
        {isOnline ? (
          <div>
            <h3 className="font-semibold text-green-700 mb-2">✓ Live Data</h3>
            <p className="text-sm text-gray-600">
              Fetching fresh content from the server...
            </p>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-orange-700 mb-2">
              ⚠ Cached Content
            </h3>
            <p className="text-sm text-gray-600">
              Showing previously downloaded content. Some features may be limited.
            </p>
          </div>
        )}
      </div>

      {/* Example 3: Disabled State for Online Features */}
      <button
        disabled={!isOnline}
        className={`w-full py-2 px-4 rounded-lg font-medium transition ${
          isOnline
            ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isOnline ? "Upload Content" : "Offline - Cannot Upload"}
      </button>
    </div>
  );
}

/**
 * Example: Component that warns before making network-heavy operations
 */
export function NetworkAwareUpload() {
  const isOnline = useOnlineStatus();

  const handleUpload = () => {
    if (!isOnline) {
      alert("You're offline. Please restore your connection before uploading.");
      return;
    }
    // Proceed with upload
    console.log("Uploading...");
  };

  return (
    <button
      onClick={handleUpload}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!isOnline}
    >
      {isOnline ? "Upload File" : "Offline - Cannot Upload"}
    </button>
  );
}

/**
 * Example: Status Banner that shows only when offline
 */
export function OfflineStatusBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 flex items-center gap-2">
      <WifiOff className="w-5 h-5" />
      <span className="text-sm font-medium">No internet connection</span>
    </div>
  );
}
