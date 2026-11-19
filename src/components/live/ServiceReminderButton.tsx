"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  disableReminders,
  enableReminders,
  getReminderState,
  type ReminderState,
} from "@/lib/pushClient";

/**
 * "Remind me before services": a push notification about 30 minutes before
 * each service on the admin schedule. Renders nothing until the browser's
 * state is known, or when reminders aren't set up on the server.
 */
export default function ServiceReminderButton({ className = "" }: { className?: string }) {
  const [state, setState] = useState<ReminderState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReminderState().then((s) => !cancelled && setState(s));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || state === "unconfigured" || state === "unsupported") return null;

  if (state === "ios-install") {
    return (
      <p className={`text-xs text-muted-foreground text-center ${className}`}>
        To get service reminders on iPhone, tap Share, then &ldquo;Add to Home
        Screen&rdquo;, and open the site from there.
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className={`text-xs text-muted-foreground text-center ${className}`}>
        Notifications are blocked for this site. Allow them in your browser&apos;s
        site settings to get service reminders.
      </p>
    );
  }

  const on = state === "on";
  const toggle = async () => {
    setBusy(true);
    try {
      const next = on ? await disableReminders() : await enableReminders();
      setState(next);
      if (next === "on") toast.success("We'll remind you about 30 minutes before each service.");
      else if (on) toast.success("Service reminders turned off.");
    } catch (err) {
      console.error("[reminders]", err);
      toast.error("Couldn't update reminders. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? Loader2 : on ? BellOff : BellRing;
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={on}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 cursor-pointer ${
        on
          ? "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
      } ${className}`}
    >
      <Icon className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
      {on ? "Turn off service reminders" : "Remind me before services"}
    </button>
  );
}
