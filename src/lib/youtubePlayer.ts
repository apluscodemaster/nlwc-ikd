// Shared YouTube IFrame Player API loader
// Used by VideoMessagesContent, MediaHub, and LivePage to initialise YT players

let ytApiLoadPromise: Promise<void> | null = null;

/**
 * Loads the YouTube IFrame Player API script and resolves when `YT.Player`
 * is available on the global `window` object.
 */
export function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!ytApiLoadPromise) {
    ytApiLoadPromise = new Promise<void>((resolve) => {
      // If the callback was already set by another module, chain them
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve();
      };

      // Only inject the script tag once
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      } else if (window.YT?.Player) {
        // Script already loaded by something else
        resolve();
      }
    });
  }

  return ytApiLoadPromise;
}
