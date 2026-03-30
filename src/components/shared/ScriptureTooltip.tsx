"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Book, Loader2 } from "lucide-react";
import {
  fetchBibleVerse,
  getBibleGatewayUrl,
  BibleVerse,
} from "@/lib/bible-api";

interface ScriptureTooltipProps {
  reference: string;
  children: React.ReactNode;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: "bottom" | "top";
  arrowLeft: number;
}

export default function ScriptureTooltip({
  reference,
  children,
}: ScriptureTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verseData, setVerseData] = useState<BibleVerse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320; // Max tooltip width
    const tooltipHeight = 250; // Approximate max height
    const padding = 16; // Padding from screen edges
    const arrowSize = 8;

    // Calculate initial position (centered above trigger)
    let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
    let top = triggerRect.top - tooltipHeight - arrowSize;
    let arrowPosition: "bottom" | "top" = "bottom";
    let arrowLeft = tooltipWidth / 2;

    // Adjust horizontal position if too close to edges
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

    // If not enough space above, show below
    if (top < padding) {
      top = triggerRect.bottom + arrowSize;
      arrowPosition = "top";
    }

    // Add scroll offset
    top += window.scrollY;
    left = Math.max(padding, left);

    setPosition({ top, left, arrowPosition, arrowLeft });
  }, []);

  const handleMouseEnter = useCallback(async () => {
    setIsOpen(true);
    calculatePosition();

    // Only fetch if we haven't already
    if (!verseData && !isLoading) {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchBibleVerse(reference);
        if (data) {
          setVerseData(data);
        } else {
          setError("Could not load verse");
        }
      } catch {
        setError("Failed to load verse");
      } finally {
        setIsLoading(false);
      }
    }
  }, [reference, verseData, isLoading, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      const handleReposition = () => calculatePosition();
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);
      return () => {
        window.removeEventListener("scroll", handleReposition, true);
        window.removeEventListener("resize", handleReposition);
      };
    }
  }, [isOpen, calculatePosition]);

  const bibleGatewayUrl = getBibleGatewayUrl(reference);

  const tooltipContent = (
    <AnimatePresence>
      {isOpen && position && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] w-80 max-w-[calc(100vw-32px)]"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-primary/10 px-4 py-2 border-b border-primary/10">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Book className="w-4 h-4" />
                {verseData?.reference || reference}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading verse...
                </div>
              ) : error ? (
                <div className="text-sm text-red-500 text-center py-2">
                  {error}
                </div>
              ) : verseData ? (
                <div className="space-y-3">
                  {/* Verse Text */}
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    &ldquo;{verseData.text.trim()}&rdquo;
                  </p>

                  {/* Translation Tag */}
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {verseData.translation} Translation
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Hover to load verse
                </div>
              )}
            </div>

            {/* Footer with Read More */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <a
                href={bibleGatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Read More on Bible Gateway
              </a>
            </div>
          </div>

          {/* Arrow pointer */}
          <div
            className={`absolute w-0 h-0 border-l-8 border-r-8 border-transparent ${
              position.arrowPosition === "bottom"
                ? "border-t-8 border-t-white -bottom-2"
                : "border-b-8 border-b-white -top-2"
            }`}
            style={{ left: position.arrowLeft - 8 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className="scripture-reference text-primary font-semibold cursor-help border-b border-dashed border-primary/50 hover:border-primary transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {isMounted && createPortal(tooltipContent, document.body)}
    </>
  );
}
