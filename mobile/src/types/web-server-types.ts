/**
 * Data shapes the app receives from the website's API, mirrored from web
 * modules that are server-only (they import firebase-admin, Google Sheets or
 * Next.js). Importing even a *type* from those files makes TypeScript check
 * the whole file, which fails without the web app's node_modules (e.g. in CI).
 * Keep these in sync with the referenced web definitions.
 */

/** Mirrors src/lib/videoMessages.ts `VideoMessage` (GET /api/video-messages). */
export interface VideoMessage {
  date: string;
  youtubeUrl: string;
  title?: string;
  minister?: string;
  serviceCategory?: string;
  /** YouTube video id (also used for thumbnails) */
  id: string;
}

/** Mirrors src/lib/scheduleService.ts `RecurringService` (GET /api/schedule). */
export interface RecurringService {
  id?: string;
  /** 0 = Sun … 6 = Sat */
  dayOfWeek: number;
  /** 24-h start hour (decimals allowed, e.g. 18.5 = 6:30 PM) */
  startHour: number;
  /** 24-h end hour (exclusive) */
  endHour: number;
  endsNextDay?: boolean;
  label: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  category?: string;
  icon?: string;
  recurrenceLabel?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors src/lib/scheduleService.ts `SpecialService` (GET /api/schedule). */
export interface SpecialService {
  id?: string;
  /** YYYY-MM-DD */
  date: string;
  startHour: number;
  endHour: number;
  endsNextDay?: boolean;
  label: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  category?: string;
  icon?: string;
  recurrenceLabel?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
