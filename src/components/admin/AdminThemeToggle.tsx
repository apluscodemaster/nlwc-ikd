"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

/**
 * Admin-only dark mode.
 *
 * The choice (light / dark / system) is kept in this browser. While an admin
 * page is open, dark mode puts `admin-dark` on <html>; app/admin/admin-theme.css
 * then remaps Tailwind's colour variables (grays flip, pale tints become
 * translucent, white cards become dark), so every admin page follows without
 * per-element dark: classes. The class is removed when leaving /admin, so the
 * public site always stays light. Pop-up previews (data-admin-light) keep the
 * site's light look.
 */
export type AdminThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "nlwc-admin-theme";
const CLASS = "admin-dark";

function readMode(): AdminThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

/** Applies the admin theme while mounted (use once, in the admin layout). */
export function useAdminTheme() {
  const [mode, setModeState] = useState<AdminThemeMode>("system");

  useEffect(() => {
    setModeState(readMode());
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && media.matches);
      document.documentElement.classList.toggle(CLASS, dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      document.documentElement.classList.remove(CLASS);
    };
  }, [mode]);

  const setMode = (next: AdminThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return { mode, setMode };
}

const OPTIONS: { mode: AdminThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "system", label: "System", Icon: Monitor },
  { mode: "dark", label: "Dark", Icon: Moon },
];

/** Three-way switch (sidebar); `compact` cycles through them with one button. */
export function AdminThemeToggle({
  mode,
  setMode,
  compact,
}: {
  mode: AdminThemeMode;
  setMode: (m: AdminThemeMode) => void;
  compact?: boolean;
}) {
  if (compact) {
    const i = OPTIONS.findIndex((o) => o.mode === mode);
    const current = OPTIONS[i];
    const next = OPTIONS[(i + 1) % OPTIONS.length];
    return (
      <button
        type="button"
        onClick={() => setMode(next.mode)}
        title={`Theme: ${current.label} (switch to ${next.label})`}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
      >
        <current.Icon className="w-4 h-4" />
      </button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Admin theme" className="flex items-center gap-1 p-1 rounded-xl bg-gray-100">
      {OPTIONS.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
