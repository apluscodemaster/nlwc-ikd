import { BookOpen, Calendar, Church, LucideIcon, Sparkles, Users } from "lucide-react";
import PrayingHands from "@/components/shared/PrayingHandsIcon";
import type { RecurringService } from "@/lib/scheduleService";

/**
 * Service presentation for the homepage "Fellowship Gatherings" section.
 *
 * The weekly services themselves come from the admin schedule
 * (Admin → Settings → Schedule, read via GET /api/schedule), so their names,
 * days, times and venues follow admin changes. This file only supplies how a
 * service looks (icon, colours, fallback image and description, chosen by its
 * admin category) and the annual meetings, which aren't weekly entries in the
 * schedule. The mobile app's mobile/src/data/services.ts mirrors this.
 */

export interface ServiceVisual {
  icon: LucideIcon;
  color: string;
  iconColor: string;
  /** Used when the admin entry has no imageUrl. */
  image?: string;
  /** Used when the admin entry has no description. */
  description: string;
}

const VISUALS = {
  worship: {
    icon: Church,
    color: "bg-orange-50",
    iconColor: "text-orange-600",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1775202517/Sunday-service_yqnt8b.jpg",
    description: "Join us for an uplifting morning of worship and transformative teaching.",
  },
  prayer: {
    icon: PrayingHands,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
    image:
      "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247627/nlwc-ikd-assets/m6cvj4hlycpdwzd61vfh.avif",
    description: "Standing together in faith and interceding for our community.",
  },
  study: {
    icon: BookOpen,
    color: "bg-green-50",
    iconColor: "text-green-600",
    image:
      "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247542/nlwc-ikd-assets/pm8b0f37oyetsclcesg7.avif",
    description: "Deep dive into God's word and grow in your understanding of faith.",
  },
  other: {
    icon: Calendar,
    color: "bg-gray-50",
    iconColor: "text-gray-600",
    description: "Join us at the Church Auditorium.",
  },
} satisfies Record<string, ServiceVisual>;

/** How a weekly service looks, by its admin category, then by its label. */
export function serviceVisual(s: Pick<RecurringService, "category" | "label">): ServiceVisual {
  const key = `${s.category ?? ""} ${s.label}`.toLowerCase();
  if (key.includes("prayer")) return VISUALS.prayer;
  if (key.includes("study") || key.includes("bible")) return VISUALS.study;
  if (key.includes("worship") || key.includes("sunday") || key.includes("service")) return VISUALS.worship;
  return VISUALS.other;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Every Wednesday" (or the admin's own recurrence label). */
export function serviceDayLabel(s: Pick<RecurringService, "recurrenceLabel" | "dayOfWeek">): string {
  return s.recurrenceLabel?.trim() || `Every ${DAYS[s.dayOfWeek] ?? ""}`.trim();
}

/** 18.5 → "6:30 PM" (admin hours are Lagos wall-clock decimals). */
export function formatServiceHour(hour: number): string {
  const h24 = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
}

export interface AnnualMeeting {
  id: string;
  name: string;
  /** When in the year it holds, e.g. "Sundays in September". */
  period: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  image?: string;
}

/** Annual meetings: not weekly entries in the admin schedule. */
export const annualMeetings: AnnualMeeting[] = [
  {
    id: "season-of-the-spirit",
    name: "Season of the Spirit",
    period: "February – March",
    description: "A special season of spiritual refreshing and prophetic advancement.",
    icon: Sparkles,
    color: "bg-amber-50",
    iconColor: "text-amber-600",
    image:
      "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247798/nlwc-ikd-assets/nu4dqvqovsnbodckjmnu.avif",
  },
  {
    id: "family-life-festival",
    name: "Family Life Festival",
    period: "Sundays in September",
    description: "A month of Sundays devoted to building strong marriages and families.",
    icon: Users,
    color: "bg-rose-50",
    iconColor: "text-rose-600",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/f_auto,q_auto:eco,w_800/v1775202695/community-2_vwupj4.jpg",
  },
];

/** An annual meeting as the admin Schedule page stores it (/api/schedule). */
export interface AdminAnnualMeeting {
  id?: string;
  name: string;
  period: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  order?: number;
}

/**
 * Icon, colours and fallback image/description for an admin annual meeting:
 * the built-in look for a known one (matched by name), otherwise a generic one.
 */
export function annualVisual(
  m: Pick<AdminAnnualMeeting, "name">,
): Pick<AnnualMeeting, "icon" | "color" | "iconColor" | "image" | "description"> {
  const key = m.name.trim().toLowerCase();
  const known = annualMeetings.find((a) => a.name.toLowerCase() === key);
  return known ?? { icon: Sparkles, color: "bg-amber-50", iconColor: "text-amber-600", description: "" };
}
