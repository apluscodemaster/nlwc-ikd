"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Logos RefTagger — auto-detects Bible references and shows the verse on
 * hover — loaded only where there is scripture text to tag.
 *
 * It used to load on every page from the root layout, admin included, and
 * re-scan the whole DOM after every navigation. Now the script is added the
 * first time a visitor reaches a content page (and kept from then on, since a
 * loaded script can't be unloaded), and only content pages are re-scanned.
 *
 * Content rendered by ScriptureContent opts out with the `no-reftagger` class:
 * the in-app ScriptureProvider tags it instead.
 */

/** Routes with no scripture text to tag. */
const SKIP_PREFIXES = [
  "/admin",
  "/offline",
  "/gallery",
  "/give",
  "/contact",
  "/fellowship",
];

function isContentRoute(pathname: string): boolean {
  return !SKIP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const CONFIG = `
  window.refTagger = {
    settings: {
      bibleVersion: "KJV",
      tooltipStyle: "dark",
      socialSharing: [],
      tagChapters: true,
      dropShadow: true,
      noSearchTagNames: ["H1", "H2", "H3", "INPUT", "TEXTAREA"],
      noSearchClassNames: ["no-reftagger"],
      tagColor: "#FF7C18"
    }
  };
`;

export default function RefTaggerReloader() {
  const pathname = usePathname() ?? "/";
  const onContent = isContentRoute(pathname);
  // Once loaded on a content page, the script stays for the session.
  const [load, setLoad] = useState(onContent);
  useEffect(() => {
    if (onContent) setLoad(true);
  }, [onContent]);

  // RefTagger scans the DOM once when it loads; re-tag content pages after
  // client-side navigation.
  useEffect(() => {
    if (!onContent) return;
    const timer = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).refTagger?.tag?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname, onContent]);

  if (!load) return null;
  return (
    <>
      <Script
        id="reftagger-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: CONFIG }}
      />
      <Script
        id="reftagger"
        src="https://api.reftagger.com/v2/RefTagger.js"
        strategy="lazyOnload"
      />
    </>
  );
}
