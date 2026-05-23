"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";

interface PostAnswerChipProps {
  /** Whether this was a slow answer (>8s) */
  isSlow: boolean;
  /** Auto-dismiss timeout: 4000ms normal, 6000ms for slow answers */
  onTap: () => void;
  onDismiss: () => void;
}

export default function PostAnswerChip({
  isSlow,
  onTap,
  onDismiss,
}: PostAnswerChipProps) {
  const [visible, setVisible] = useState(true);
  const dismissMs = isSlow ? 6000 : 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, dismissMs);
    return () => clearTimeout(timer);
  }, [dismissMs, onDismiss]);

  const chipText = isSlow
    ? "Tricky one. Want the quick breakdown?"
    : "Hear the 20-sec why";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-6 z-40"
        >
          <button
            onClick={() => {
              setVisible(false);
              onTap();
            }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:px-5 rounded-2xl sm:rounded-full bg-emerald-600 text-white text-[13px] sm:text-sm font-bold shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 active:scale-[0.97] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4" />
            {chipText}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
