"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Wifi, WifiOff, RotateCw, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";

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

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
    setIsOnline(navigator.onLine);

    // Poll for connectivity every 3 seconds when offline
    let connectivityCheckInterval: NodeJS.Timeout | null = null;

    const startConnectivityCheck = () => {
      if (connectivityCheckInterval) return;
      connectivityCheckInterval = setInterval(async () => {
        const isConnected = await verifyConnectivity();
        if (isConnected) {
          console.log("Connection restored - navigating to home");
          setIsOnline(true);
          if (connectivityCheckInterval) {
            clearInterval(connectivityCheckInterval);
          }
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        }
      }, 3000);
    };

    const handleOnline = async () => {
      console.log("Online event detected, verifying connectivity...");
      setCheckingConnection(true);
      const isConnected = await verifyConnectivity();
      setCheckingConnection(false);

      if (isConnected) {
        setIsOnline(true);
        console.log("Connection verified - navigating to home");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        // Start polling if connection is not yet verified
        startConnectivityCheck();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (connectivityCheckInterval) {
        clearInterval(connectivityCheckInterval);
        connectivityCheckInterval = null;
      }
    };

    // If currently offline, start connectivity polling
    if (!navigator.onLine) {
      startConnectivityCheck();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connectivityCheckInterval !== null) {
        clearInterval(connectivityCheckInterval);
      }
    };
  }, []);

  const handleRetry = async () => {
    setCheckingConnection(true);
    const isConnected = await verifyConnectivity();
    setCheckingConnection(false);

    if (isConnected) {
      window.location.href = "/";
    } else {
      // Just reload the page to retry
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl">
        {/* Animated Icon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={showAnimation ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-8"
        >
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/30">
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <WifiOff className="w-14 h-14 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={showAnimation ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
            No Connection
          </h1>
          <div className="text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
            Internet Offline
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={showAnimation ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-8"
        >
          <p className="text-lg text-gray-600 mb-4">
            It looks like you&apos;ve lost your internet connection. Please
            check your network and try again.
          </p>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Connection Status:{" "}
            <span className="font-semibold text-red-600">Offline</span>
          </p>
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showAnimation ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-10"
        >
          <div className="px-6 py-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center gap-3">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                  className="w-3 h-3 bg-red-500 rounded-full"
                />
              ))}
            </div>
            <span className="text-red-700 font-medium">
              {isOnline
                ? "✓ Connection Restored!"
                : "Waiting for connection..."}
            </span>
          </div>
        </motion.div>

        {/* Troubleshooting Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={showAnimation ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full mb-10 p-6 rounded-2xl bg-blue-50 border border-blue-200"
        >
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Troubleshooting Steps
          </h3>
          <ul className="space-y-3 text-blue-900 text-sm">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
              <span>Check your WiFi or mobile data connection</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
              <span>Turn off Airplane mode if it&apos;s enabled</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
              <span>Restart your router or mobile device</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
              <span>Check if other apps can access the internet</span>
            </li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showAnimation ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center"
        >
          <Button
            size="lg"
            onClick={handleRetry}
            disabled={checkingConnection}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-full px-8 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingConnection ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5"
                >
                  <RotateCw className="w-5 h-5" />
                </motion.div>
                Checking Connection...
              </>
            ) : (
              <>
                <RotateCw className="w-5 h-5" />
                Try Again
              </>
            )}
          </Button>
          <Link href="/">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 font-semibold border-2 hover:bg-gray-50 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Button>
          </Link>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showAnimation ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 text-center text-xs text-gray-500"
        >
          <p>
            Once your connection is restored, you can continue browsing. This
            page will automatically redirect you.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
