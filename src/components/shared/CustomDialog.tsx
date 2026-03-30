"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type DialogType = "alert" | "confirm" | "prompt";

interface DialogState {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "success" | "warning" | "info";
  resolve?: (value: string | boolean | null) => void;
}

const INITIAL_STATE: DialogState = {
  isOpen: false,
  type: "alert",
  title: "",
  message: "",
};

// ─── Singleton State (module-level for global access) ─────────────────────────
let dialogSetter: React.Dispatch<React.SetStateAction<DialogState>> | null =
  null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Show a styled alert dialog (replaces window.alert)
 */
export function showAlert(
  message: string,
  options?: {
    title?: string;
    variant?: "success" | "warning" | "info";
    confirmLabel?: string;
  },
): Promise<void> {
  return new Promise((resolve) => {
    dialogSetter?.({
      isOpen: true,
      type: "alert",
      title: options?.title || "Notice",
      message,
      variant: options?.variant || "info",
      confirmLabel: options?.confirmLabel || "OK",
      resolve: () => resolve(),
    });
  });
}

/**
 * Show a styled confirm dialog (replaces window.confirm)
 */
export function showConfirm(
  message: string,
  options?: {
    title?: string;
    variant?: "success" | "warning" | "info";
    confirmLabel?: string;
    cancelLabel?: string;
  },
): Promise<boolean> {
  return new Promise((resolve) => {
    dialogSetter?.({
      isOpen: true,
      type: "confirm",
      title: options?.title || "Confirm",
      message,
      variant: options?.variant || "info",
      confirmLabel: options?.confirmLabel || "Confirm",
      cancelLabel: options?.cancelLabel || "Cancel",
      resolve: (val) => resolve(val as boolean),
    });
  });
}

/**
 * Show a styled prompt dialog (replaces window.prompt)
 */
export function showPrompt(
  message: string,
  options?: {
    title?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  },
): Promise<string | null> {
  return new Promise((resolve) => {
    dialogSetter?.({
      isOpen: true,
      type: "prompt",
      title: options?.title || "Input Required",
      message,
      placeholder: options?.placeholder || "",
      defaultValue: options?.defaultValue || "",
      confirmLabel: options?.confirmLabel || "OK",
      cancelLabel: options?.cancelLabel || "Cancel",
      resolve: (val) => resolve(val as string | null),
    });
  });
}

// ─── Dialog Component ─────────────────────────────────────────────────────────
export default function CustomDialog() {
  const [state, setState] = useState<DialogState>(INITIAL_STATE);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    dialogSetter = setState;
    setMounted(true);
    return () => {
      dialogSetter = null;
    };
  }, []);

  // Focus input when prompt opens
  useEffect(() => {
    if (state.isOpen && state.type === "prompt") {
      setInputValue(state.defaultValue || "");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.isOpen, state.type, state.defaultValue]);

  const handleClose = useCallback(
    (result: string | boolean | null) => {
      state.resolve?.(result);
      setState(INITIAL_STATE);
    },
    [state],
  );

  const handleConfirm = useCallback(() => {
    if (state.type === "alert") handleClose(true);
    else if (state.type === "confirm") handleClose(true);
    else if (state.type === "prompt") handleClose(inputValue);
  }, [state.type, inputValue, handleClose]);

  const handleCancel = useCallback(() => {
    if (state.type === "confirm") handleClose(false);
    else if (state.type === "prompt") handleClose(null);
    else handleClose(true);
  }, [state.type, handleClose]);

  // Handle Enter/Escape keys
  useEffect(() => {
    if (!state.isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.isOpen, handleConfirm, handleCancel]);

  const variantConfig = {
    success: {
      icon: CheckCircle2,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
    },
    warning: {
      icon: AlertCircle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      buttonBg: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: MessageSquare,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      buttonBg: "bg-primary hover:bg-primary/90",
    },
  };

  const config = variantConfig[state.variant || "info"];
  const Icon = config.icon;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {state.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 28, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start gap-4 p-5 pb-3">
              <div
                className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900">
                  {state.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {state.message}
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt Input */}
            {state.type === "prompt" && (
              <div className="px-5 pb-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={state.placeholder}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 p-5 pt-4">
              {state.type !== "alert" && (
                <button
                  onClick={handleCancel}
                  className="h-10 px-5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {state.cancelLabel || "Cancel"}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`h-10 px-5 rounded-xl text-sm font-semibold text-white ${config.buttonBg} shadow-sm transition-colors`}
              >
                {state.confirmLabel || "OK"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
