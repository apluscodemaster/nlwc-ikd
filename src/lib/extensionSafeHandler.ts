/**
 * Extension-Safe Message Handler
 * Prevents "A listener indicated an asynchronous response by returning true,
 * but the message channel closed before a response was received" errors
 *
 * These errors typically come from browser extensions (translator, Copilot, etc.)
 * trying to communicate with the page. This module provides safe handling.
 */

type MessageHandler = (
  message: any,
  sender: any,
  sendResponse: (response?: any) => void,
) => boolean | void | Promise<any>;

let isInitialized = false;

export function initializeExtensionSafeHandler() {
  if (isInitialized || typeof window === "undefined") return;

  isInitialized = true;

  // Listen for messages from extensions via chrome.runtime
  try {
    if (
      typeof (window as any).chrome !== "undefined" &&
      (window as any).chrome?.runtime?.onMessage
    ) {
      (window as any).chrome.runtime.onMessage.addListener(
        (message: any, sender: any, sendResponse: (response?: any) => void) => {
          // Send an immediate response to prevent "message channel closed" errors
          try {
            sendResponse({ received: true });
          } catch (err) {
            // Connection already closed, ignore
          }
          return false; // Don't return true to indicate async response
        },
      );
    }
  } catch (err) {
    // chrome.runtime might not be available or other errors
    // Silently ignore
  }

  // Also handle window messages from extensions that use postMessage
  try {
    window.addEventListener(
      "message",
      (event) => {
        // Only handle messages from the page itself (not from iframes or external sources)
        if (event.source !== window) return;

        const data = event.data;
        if (!data || typeof data !== "object") return;

        // Check for common extension message patterns
        const isLikelyExtensionMessage =
          data.type?.startsWith?.("ext_") ||
          data.type?.startsWith?.("extension_") ||
          data.type?.startsWith?.("__") ||
          data.__extension__ === true ||
          data.extensionMessage === true;

        if (isLikelyExtensionMessage) {
          // Log but don't throw - just acknowledge
          console.debug("Extension message detected:", data.type || "unknown");
        }
      },
      true, // Use capture phase to intercept early
    );
  } catch (err) {
    // Silently ignore
  }
}

// Initialize on module load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeExtensionSafeHandler,
    );
  } else {
    initializeExtensionSafeHandler();
  }
}
