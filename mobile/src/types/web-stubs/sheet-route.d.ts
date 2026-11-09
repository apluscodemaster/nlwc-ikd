/**
 * Type stub for the web module "@/app/api/sheet/route" (a Next.js route
 * handler). utils/driveImage.ts, which the app reuses for sizedGoogleImage,
 * type-imports `NormalizedColumn` from it; the real file imports next/server
 * and server SDKs. tsconfig.json maps that one path here (TypeScript only:
 * type imports are erased, so Metro never loads it). Mirrors the real type.
 */
import type { RawColumn } from "@web/lib/sheets";

export type NormalizedColumn = RawColumn & {
  images?: string[];
};
