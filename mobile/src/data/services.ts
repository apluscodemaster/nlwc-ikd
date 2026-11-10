/**
 * Service icons and annual meetings for Home.
 *
 * The weekly service times themselves come from the admin schedule
 * (GET /api/schedule → recurring services), so changes made in
 * Admin → Settings → Schedule appear in the app automatically. This file only
 * maps each service's category to an icon, and lists the annual meetings,
 * which aren't weekly entries in that schedule.
 */
import { BookOpen, Calendar, Church, PrayingHands, Sparkles, Users, type LucideIcon } from "~/components/icons";
import type { RecurringService } from "~/shared";

/** Icon for a weekly service, by its admin category, then by its label. */
export function serviceIcon(s: Pick<RecurringService, "category" | "label">): LucideIcon {
  const key = `${s.category ?? ""} ${s.label}`.toLowerCase();
  if (key.includes("prayer")) return PrayingHands;
  if (key.includes("study") || key.includes("bible")) return BookOpen;
  if (key.includes("worship") || key.includes("sunday") || key.includes("service")) return Church;
  return Calendar;
}

export interface AnnualMeeting {
  id: string;
  name: string;
  /** When in the year it holds, e.g. "Sundays in September". */
  period: string;
  /** Short form for the right-hand column, e.g. "Sept". */
  short: string;
  description: string;
  icon: LucideIcon;
}

export const annualMeetings: AnnualMeeting[] = [
  {
    id: "season-of-the-spirit",
    name: "Season of the Spirit",
    period: "February – March",
    short: "Feb – Mar",
    description: "A special season of spiritual refreshing and prophetic advancement.",
    icon: Sparkles,
  },
  {
    id: "family-life-festival",
    name: "Family Life Festival",
    period: "Sundays in September",
    short: "Sept",
    description: "A month of Sundays devoted to building strong marriages and families.",
    icon: Users,
  },
];
