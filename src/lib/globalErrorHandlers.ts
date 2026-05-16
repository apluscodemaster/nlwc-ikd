/**
 * Global Error Handler for Extension-Related Errors
 * Suppresses "A listener indicated an asynchronous response by returning true" errors
 * that come from browser extensions trying to communicate with the page
 */

let hasInitialized = false;

export function setupGlobalErrorHandlers() {
  if (hasInitialized || typeof window === "undefined") return;
  hasInitialized = true;

  /**
   * Handle unhandled promise rejections
   * Suppress extension-related messaging errors that don't affect user experience
   */
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const error = event.reason;
      const message = error?.message || error?.toString() || "";

      // Suppress "A listener indicated an asynchronous response" errors
      if (
        message.includes(
          "A listener indicated an asynchronous response by returning true",
        ) ||
        message.includes("message channel closed") ||
        message.includes("MessagePort")
      ) {
        // Prevent the error from being logged and causing issues
        event.preventDefault();
        console.debug(
          "Suppressed extension messaging error (non-critical):",
          message,
        );
        return;
      }
    },
    true, // Use capture phase
  );

  /**
   * Handle errors that might occur during extension communication
   */
  window.addEventListener(
    "error",
    (event) => {
      const message = event.message || "";

      // Suppress extension-related errors
      if (
        message.includes(
          "A listener indicated an asynchronous response by returning true",
        ) ||
        message.includes("message channel closed") ||
        message.includes("extension") ||
        message.includes("MessagePort")
      ) {
        // Suppress but log for debugging
        console.debug("Suppressed extension error (non-critical):", message);
        event.preventDefault();
        return false;
      }
    },
    true, // Use capture phase
  );
}

// Initialize on module load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupGlobalErrorHandlers);
  } else {
    setupGlobalErrorHandlers();
  }
}
