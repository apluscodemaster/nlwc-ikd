/**
 * The ONLY entry point for code reused from the web app (`../src`).
 *
 * Feature code imports from `~/shared`, never from `@web/…` directly, so this
 * file is the complete list of web code that ships in the app. Every value
 * import here is checked by `npm run check:shared`: the module and everything
 * it imports must be free of React, Next.js, Node built-ins, server SDKs and
 * the DOM (see docs/ARCHITECTURE.md §5).
 *
 * Type-only re-exports are always safe (erased at compile time) and may come
 * from any web module.
 */

/* ── Live schedule (Lagos time) ─────────────────────────────────────────── */
// Calls fetch("/api/schedule"); the relative URL is resolved by
// installApiFetch() in src/lib/apiFetch.ts.
export {
  loadScheduleFromApi,
  isScheduleLoaded,
  isCurrentlyLive,
  getCurrentServiceStartTime,
  getNextService,
  getCurrentMeetingTitle,
} from "@web/lib/liveSchedule";
export type { ScheduledService, NextServiceInfo } from "@web/lib/liveSchedule";

/* ── Sermons, parts and playback progress ───────────────────────────────── */
export {
  parseSermonPart,
  normalizeBaseTitle,
  hasSermonPart,
  findAdjacentParts,
} from "@web/lib/sermonParts";
export type { SermonPartInfo } from "@web/lib/sermonParts";

// localStorage-backed; works through the expo-sqlite localStorage polyfill.
export {
  saveMediaProgress,
  getMediaProgress,
  clearMediaProgress,
  formatProgressTime,
} from "@web/lib/mediaProgress";
export type { MediaProgress } from "@web/lib/mediaProgress";

export { toStreamableAudioUrl, isGoogleDriveUrl } from "@web/utils/audioUrl";

// Types only: lib/audioSermons fetches WordPress server-side; the app goes
// through /api/audio-sermons instead.
export type {
  AudioSermon,
  AudioSermonsResponse,
  SeriesItem,
  SpeakerItem,
  TopicItem,
} from "@web/lib/audioSermons";

/* ── Transcripts and manuals ────────────────────────────────────────────── */
export {
  fetchTranscriptSlugs,
  findTranscriptSlug,
} from "@web/utils/transcriptSlug";
export type { TranscriptStub } from "@web/utils/transcriptSlug";

export { WP_CATEGORIES, TRANSCRIPT_CATEGORIES } from "@web/lib/wordpress";
export type {
  TranscriptPost,
  TranscriptType,
  SundaySchoolManual,
  TranscriptCategory,
} from "@web/lib/wordpress";

export { calculateReadingTime } from "@web/utils/readingTime";
export {
  highlightSearchInHtml,
  highlightSearchInText,
} from "@web/utils/highlightSearch";
export { stripLeadingSpeakerLine } from "@web/utils/speakerLine";
export { formatMemoryTrack } from "@web/utils/formatMemoryTrack";
export { manualBackgroundFor } from "@web/utils/manualThumbnail";

/* ── Bible ──────────────────────────────────────────────────────────────── */
export { searchBible } from "@web/lib/bibleSearch";
export type { Verse, SearchResult, ParsedReference } from "@web/types/bible";

/* ── Quiz ───────────────────────────────────────────────────────────────── */
export { QUIZ_CATEGORIES } from "@web/types/quiz";
export type * from "@web/types/quiz";
export {
  loadMasteryState,
  saveMasteryState,
  recordCorrectReview,
  computeMasteryPercent,
} from "@web/lib/quizMastery";
export type { MasteryState } from "@web/lib/quizMastery";
export { checkMilestones, checkTopScore } from "@web/lib/quizCelebrations";
export type { MilestoneHit } from "@web/lib/quizCelebrations";
export {
  SECURITY_QUESTIONS,
  SELF_RESET_COOLDOWN_DAYS,
  normalizeSecurityAnswer,
  normalizeRecoveryCode,
  formatRecoveryCode,
} from "@web/lib/quizSecurity";

/* ── Fellowship, team, events ───────────────────────────────────────────── */
export { haversineKm, extractCoordinates } from "@web/utils/mapCoordinates";
export type { LatLng } from "@web/utils/mapCoordinates";
export { fellowshipCenters } from "@web/data/centers";
export type { FellowshipCenter } from "@web/data/centers";
export { team } from "@web/data/team";
export type { TeamMember } from "@web/data/team";
export { generateGoogleCalendarUrl } from "@web/data/events";
export type { ChurchEvent } from "@web/data/events";
export { specialEventsForMonth } from "@web/lib/specialEvents";
