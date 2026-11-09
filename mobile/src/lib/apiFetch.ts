/**
 * Makes relative "/api/…" fetches work on React Native.
 *
 * Several reused web modules call fetch("/api/schedule") and similar relative
 * URLs, which resolve against the page origin in a browser. React Native has
 * no origin, so this wraps global fetch once at startup and prefixes
 * relative `/api/` URLs with the API base URL. Absolute URLs and Request
 * objects are passed through untouched.
 */
import { API_BASE_URL, CLIENT_HEADER } from "./config";

let installed = false;

export function resolveApiUrl(input: string): string {
  return input.startsWith("/api/") ? `${API_BASE_URL}${input}` : input;
}

export function installApiFetch(): void {
  if (installed) return;
  installed = true;
  const original = globalThis.fetch.bind(globalThis);

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const headers = new Headers(init?.headers);
      for (const [k, v] of Object.entries(CLIENT_HEADER)) {
        if (!headers.has(k)) headers.set(k, v);
      }
      // Next.js-only fetch options (e.g. `next: { revalidate }`) are ignored by
      // React Native's fetch, so they can be passed through as-is.
      return original(resolveApiUrl(input), { ...init, headers });
    }
    return original(input as RequestInfo, init);
  }) as typeof fetch;
}
