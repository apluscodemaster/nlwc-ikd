/**
 * Extension-Safe Message Handler
 * Prevents "A listener indicated an asynchronous response by returning true,
 * but the message channel closed before a response was received" errors
 *
 * These errors typically come from browser extensions (translator, Copilot, etc.)
 * trying to communicate with the page. This module provides safe handling.
 */

/**
 * Minimal shape of the `chrome.runtime` surface we touch. The extension APIs
 * aren't typed in this project (and only exist when an extension injects them),
 * so we describe just the one listener we register rather than pulling in the
 * whole `chrome` typings.
 */
type SendResponse = (response?: unknown) => void;

interface ChromeLike {
  runtime?: {
    onMessage?: {
      addListener: (
        handler: (
          message: unknown,
          sender: unknown,
          sendResponse: SendResponse,
        ) => boolean | void,
      ) => void;
    };
  };
}

/** Extension messages arrive as arbitrary JSON — narrow before use. */
interface ExtensionMessageData {
  type?: string;
  __extension__?: boolean;
  extensionMessage?: boolean;
}

let isInitialized = false;

export function initializeExtensionSafeHandler() {
  if (isInitialized || typeof window === "undefined") return;

  isInitialized = true;

  // Listen for messages from extensions via chrome.runtime
  try {
    const chrome = (window as unknown as { chrome?: ChromeLike }).chrome;
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(
        (_message, _sender, sendResponse: SendResponse) => {
          // Send an immediate response to prevent "message channel closed" errors
          try {
            sendResponse({ received: true });
          } catch {
            // Connection already closed, ignore
          }
          return false; // Don't return true to indicate async response
        },
      );
    }
  } catch {
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

        const data = event.data as ExtensionMessageData | null;
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
  } catch {
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
