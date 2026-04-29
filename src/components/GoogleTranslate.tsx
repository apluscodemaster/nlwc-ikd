"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Languages, X, Check, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages: string;
              autoDisplay: boolean;
            },
            elementId: string,
          ): void;
        };
      };
    };
  }
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
  { code: "ar", label: "العربية" },
  { code: "zh-CN", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "de", label: "Deutsch" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "nl", label: "Nederlands" },
];

/**
 * Finds the Google Translate <select> (.goog-te-combo) that gets
 * injected into #google_translate_element after the script loads.
 * Polls briefly because the element appears asynchronously.
 */
function waitForCombo(maxAttempts = 20): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      const el = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (el) return resolve(el);
      if (++attempts >= maxAttempts) return resolve(null);
      setTimeout(check, 250);
    };
    check();
  });
}

export default function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const pathname = usePathname();
  const initRef = useRef(false);

  // Load Google Translate script & initialize the hidden widget
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Read persisted language from cookie
    const match = document.cookie.match(/googtrans=\/en\/([a-z-]+)/i);
    if (match) setCurrentLang(match[1]);

    // If already loaded (e.g. HMR), just mark ready
    if (document.querySelector(".goog-te-combo")) {
      setReady(true);
      return;
    }

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGUAGES.map((l) => l.code).join(","),
          autoDisplay: false,
        },
        "google_translate_element",
      );
      // Poll until the <select> is in the DOM
      waitForCombo().then((combo) => {
        if (combo) setReady(true);
      });
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const selectLanguage = useCallback(
    async (code: string) => {
      if (code === "en") {
        // Clear cookies on all possible domain variants and reload
        const host = window.location.hostname;
        const expiry = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = `googtrans=;path=/;${expiry}`;
        document.cookie = `googtrans=;path=/;domain=${host};${expiry}`;
        document.cookie = `googtrans=;path=/;domain=.${host};${expiry}`;
        setCurrentLang("en");
        setOpen(false);
        window.location.reload();
        return;
      }

      // Find the <select> Google Translate injected
      const combo =
        (document.querySelector(".goog-te-combo") as HTMLSelectElement) ??
        (await waitForCombo(10));

      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
        setCurrentLang(code);
        setOpen(false);
      } else {
        // Absolute fallback: set cookie and hard-reload
        const host = window.location.hostname;
        document.cookie = `googtrans=/en/${code};path=/`;
        document.cookie = `googtrans=/en/${code};path=/;domain=${host}`;
        document.cookie = `googtrans=/en/${code};path=/;domain=.${host}`;
        setCurrentLang(code);
        setOpen(false);
        window.location.reload();
      }
    },
    [],
  );

  const activeLang = LANGUAGES.find((l) => l.code === currentLang);

  // Hide on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/*
        Google Translate injects its <select> inside this div.
        It must NOT be display:none or Google skips rendering.
        We use absolute positioning + zero size to hide it visually.
      */}
      <div
        id="google_translate_element"
        className="notranslate"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Translate page"
        className="notranslate fixed bottom-28 sm:bottom-24 right-4 sm:right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 shadow-lg shadow-black/10 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary/30 hover:shadow-primary/10 transition-all active:scale-95 cursor-pointer"
      >
        <Languages className="w-5 h-5" />
      </button>

      {/* Language selector panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="notranslate fixed bottom-30 sm:bottom-26 right-4 sm:right-6 z-50 w-56 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/15 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-gray-700">
                  Translate
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current language indicator */}
            {currentLang !== "en" && (
              <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                <span className="text-[11px] text-primary font-medium">
                  Viewing in {activeLang?.label}
                </span>
                <button
                  onClick={() => selectLanguage("en")}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Language list */}
            <div className="max-h-64 overflow-y-auto py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => selectLanguage(lang.code)}
                  disabled={!ready && lang.code !== "en"}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed ${
                    currentLang === lang.code
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {lang.label}
                  {currentLang === lang.code && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {!ready && lang.code !== "en" && (
                    <Loader2 className="w-3 h-3 animate-spin text-gray-300" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[9px] text-gray-400 text-center">
                Powered by Google Translate
              </p>
            </div>
          </div>
        </>
      )}

      {/* Hide Google Translate's default UI chrome */}
      <style jsx global>{`
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }
        body {
          top: 0 !important;
          position: static !important;
        }
        /* Hide the default Google bar but keep its internals functional */
        .skiptranslate > iframe {
          display: none !important;
        }
        .skiptranslate {
          height: 0 !important;
          overflow: hidden !important;
          visibility: hidden !important;
        }
      `}</style>
    </>
  );
}
