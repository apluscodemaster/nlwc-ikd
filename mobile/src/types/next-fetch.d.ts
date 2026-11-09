/**
 * Next.js augments the global `RequestInit` with a `next` option (Data Cache
 * hints), and some reused web modules pass it (lib/wordpress, lib/bible-api).
 * This mirrors that augmentation so those files type-check here; React
 * Native's fetch simply ignores the extra option at runtime.
 */
declare global {
  interface RequestInit {
    next?: { revalidate?: number | false; tags?: string[] };
  }
}

export {};
