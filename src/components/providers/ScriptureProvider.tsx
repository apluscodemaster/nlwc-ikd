"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Book, Loader2 } from "lucide-react";
import {
  fetchBibleVerse,
  getBibleGatewayUrl,
  parseScriptureReference,
  BibleVerse,
} from "@/lib/bible-api";

interface TooltipState {
  isOpen: boolean;
  reference: string;
  position: {
    top: number;
    left: number;
    arrowLeft: number;
    arrowPosition: "top" | "bottom";
  };
  verseData: BibleVerse | null;
  isLoading: boolean;
  error: string | null;
}

interface ScriptureContextType {
  showTooltip: (reference: string, triggerRect: DOMRect) => void;
  hideTooltip: () => void;
}

const ScriptureContext = createContext<ScriptureContextType | null>(null);

export function useScripture() {
  const context = useContext(ScriptureContext);
  if (!context) {
    throw new Error("useScripture must be used within ScriptureProvider");
  }
  return context;
}

/**
 * Global Scripture Provider that:
 * 1. Provides a single tooltip portal for all scripture references
 * 2. Automatically detects and wraps scripture references in the DOM
 */
export function ScriptureProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    isOpen: false,
    reference: "",
    position: { top: 0, left: 0, arrowLeft: 160, arrowPosition: "bottom" },
    verseData: null,
    isLoading: false,
    error: null,
  });
  const cacheRef = useRef<Map<string, BibleVerse>>(new Map());
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calculatePosition = useCallback((triggerRect: DOMRect) => {
    const tooltipWidth = 320;
    const tooltipHeight = 250;
    const padding = 16;
    const arrowSize = 8;

    let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
    let top = triggerRect.top - tooltipHeight - arrowSize + window.scrollY;
    let arrowPosition: "bottom" | "top" = "bottom";
    let arrowLeft = tooltipWidth / 2;

    // Horizontal adjustment
    if (left < padding) {
      arrowLeft = Math.max(
        20,
        triggerRect.left + triggerRect.width / 2 - padding,
      );
      left = padding;
    } else if (left + tooltipWidth > window.innerWidth - padding) {
      const overflow = left + tooltipWidth - (window.innerWidth - padding);
      arrowLeft = Math.min(tooltipWidth - 20, tooltipWidth / 2 + overflow);
      left = window.innerWidth - tooltipWidth - padding;
    }

    // Vertical adjustment
    if (triggerRect.top - tooltipHeight - arrowSize < padding) {
      top = triggerRect.bottom + arrowSize + window.scrollY;
      arrowPosition = "top";
    }

    return { top, left: Math.max(padding, left), arrowLeft, arrowPosition };
  }, []);

  const showTooltip = useCallback(
    async (reference: string, triggerRect: DOMRect) => {
      // Clear any pending hide
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const position = calculatePosition(triggerRect);

      // Check cache first
      const cached = cacheRef.current.get(reference);
      if (cached) {
        setTooltip({
          isOpen: true,
          reference,
          position,
          verseData: cached,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Show loading state
      setTooltip({
        isOpen: true,
        reference,
        position,
        verseData: null,
        isLoading: true,
        error: null,
      });

      // Fetch verse
      try {
        const data = await fetchBibleVerse(reference);
        if (data) {
          cacheRef.current.set(reference, data);
          setTooltip((prev) => ({
            ...prev,
            verseData: data,
            isLoading: false,
          }));
        } else {
          setTooltip((prev) => ({
            ...prev,
            error: "Could not load verse",
            isLoading: false,
          }));
        }
      } catch {
        setTooltip((prev) => ({
          ...prev,
          error: "Failed to load verse",
          isLoading: false,
        }));
      }
    },
    [calculatePosition],
  );

  const hideTooltip = useCallback(() => {
    // Small delay to allow moving to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, isOpen: false }));
    }, 100);
  }, []);

  const bibleGatewayUrl = getBibleGatewayUrl(tooltip.reference);

  // Auto-process DOM for scripture references
  useEffect(() => {
    if (!isMounted) return;

    const processScriptureReferences = () => {
      // Find all text nodes in prose content
      const proseElements = document.querySelectorAll(
        ".prose, [data-scripture-content]",
      );

      proseElements.forEach((prose) => {
        // Skip if already processed
        if (prose.getAttribute("data-scripture-processed")) return;

        const walker = document.createTreeWalker(
          prose,
          NodeFilter.SHOW_TEXT,
          null,
        );

        const textNodes: Text[] = [];
        let node;
        while ((node = walker.nextNode())) {
          textNodes.push(node as Text);
        }

        textNodes.forEach((textNode) => {
          const text = textNode.textContent || "";
          const pattern = /(\(?\d?\s?[A-Za-z]+\.?\s+\d+:\d+(?:-\d+)?\)?)/gi;
          const matches = [...text.matchAll(pattern)];

          if (matches.length === 0) return;

          // Check if matches are valid scripture references
          const validMatches = matches.filter((m) =>
            parseScriptureReference(m[0]),
          );
          if (validMatches.length === 0) return;

          // Create fragment with wrapped references
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;

          validMatches.forEach((match) => {
            const matchText = match[0];
            const matchIndex = match.index!;

            // Add text before match
            if (matchIndex > lastIndex) {
              fragment.appendChild(
                document.createTextNode(text.slice(lastIndex, matchIndex)),
              );
            }

            // Create scripture span
            const span = document.createElement("span");
            span.className =
              "scripture-reference text-primary font-semibold cursor-help border-b border-dashed border-primary/50 hover:border-primary transition-colors";
            span.textContent = matchText;
            span.setAttribute("data-scripture-ref", matchText);

            span.addEventListener("mouseenter", (e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              showTooltip(matchText, rect);
            });

            span.addEventListener("mouseleave", () => {
              hideTooltip();
            });

            fragment.appendChild(span);
            lastIndex = matchIndex + matchText.length;
          });

          // Add remaining text
          if (lastIndex < text.length) {
            fragment.appendChild(
              document.createTextNode(text.slice(lastIndex)),
            );
          }

          // Replace text node with fragment
          textNode.parentNode?.replaceChild(fragment, textNode);
        });

        prose.setAttribute("data-scripture-processed", "true");
      });
    };

    // Process on mount and after navigation
    processScriptureReferences();

    // Use MutationObserver to catch dynamically added content
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
      });
      if (shouldProcess) {
        // Debounce processing
        setTimeout(processScriptureReferences, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [isMounted, showTooltip, hideTooltip]);

  const tooltipContent = (
    <AnimatePresence>
      {tooltip.isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] w-80 max-w-[calc(100vw-32px)]"
          style={{
            top: tooltip.position.top,
            left: tooltip.position.left,
          }}
          onMouseEnter={() => {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-primary/10 px-4 py-2 border-b border-primary/10">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Book className="w-4 h-4" />
                {tooltip.verseData?.reference || tooltip.reference}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-48 overflow-y-auto">
              {tooltip.isLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading verse...
                </div>
              ) : tooltip.error ? (
                <div className="text-sm text-red-500 text-center py-2">
                  {tooltip.error}
                </div>
              ) : tooltip.verseData ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    &ldquo;{tooltip.verseData.text.trim()}&rdquo;
                  </p>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {tooltip.verseData.translation} Translation
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <a
                href={bibleGatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Read More on Bible Gateway
              </a>
            </div>
          </div>

          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-l-8 border-r-8 border-transparent ${
              tooltip.position.arrowPosition === "bottom"
                ? "border-t-8 border-t-white -bottom-2"
                : "border-b-8 border-b-white -top-2"
            }`}
            style={{ left: tooltip.position.arrowLeft - 8 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <ScriptureContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {isMounted && createPortal(tooltipContent, document.body)}
    </ScriptureContext.Provider>
  );
}
