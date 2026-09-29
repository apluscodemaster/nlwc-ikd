import { Calendar, ScrollText } from "lucide-react";
import type React from "react";

/**
 * Sections that live under /admin/settings. The settings layout renders these
 * as a sub-nav and the overview page as cards, so a new section only needs an
 * entry here plus its page.
 */
export interface SettingsSection {
  slug: string;
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    slug: "schedule",
    label: "Schedule",
    href: "/admin/settings/schedule",
    icon: Calendar,
    description: "Recurring services & special events that drive the live pages",
  },
  {
    slug: "audit-log",
    label: "Audit Log",
    href: "/admin/settings/audit-log",
    icon: ScrollText,
    description: "Who changed what, and when",
  },
];
