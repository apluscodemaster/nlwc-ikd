/**
 * Admin audit log — who changed what, when.
 *
 * Written server-side only, through the Firebase Admin SDK, so entries bypass
 * client Firestore rules and cannot be written or altered from a browser. The
 * actor is always taken from the *verified* ID token (see `requireAuthActor`),
 * never from the request body — otherwise one admin could attribute an action
 * to another.
 *
 * Recording is strictly best-effort: `recordAudit` never throws and never
 * rejects. An audit backend that is down or misconfigured must not turn a
 * working publish/delete into a 500 for the user. Failures are logged to the
 * server console instead.
 */

import { getAdminDb } from "@/lib/firebase-admin";
import type { AuthActor } from "@/lib/auth";

export const AUDIT_COLLECTION = "admin_audit_logs";

/** Coarse verb describing what happened to the resource. */
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "upload"
  | "reset"
  | "login"
  | "logout";

/** Which part of the admin surface the action touched. */
export type AuditResource =
  | "content"
  | "devotional"
  | "testimony"
  | "quiz-question"
  | "quiz-category"
  | "quiz-stats"
  | "schedule"
  | "media"
  | "session";

export interface AuditEntry {
  id: string;
  actorUid: string;
  actorEmail: string | null;
  action: AuditAction;
  resource: AuditResource;
  /** Human-readable target, e.g. a post title or devotional date. */
  target: string | null;
  /** Stable id of the target where one exists (WP post id, doc id, …). */
  targetId: string | null;
  /** Whether the underlying operation succeeded. */
  status: "success" | "failure";
  /** Small, non-sensitive extras — field names changed, counts, error text. */
  detail: Record<string, string | number | boolean | null> | null;
  ip: string | null;
  userAgent: string | null;
  /** Epoch milliseconds. */
  at: number;
}

export interface RecordAuditInput {
  actor: AuthActor;
  action: AuditAction;
  resource: AuditResource;
  target?: string | null;
  targetId?: string | number | null;
  status?: "success" | "failure";
  detail?: Record<string, string | number | boolean | null> | null;
  request?: Request;
}

/** Cap on any single string we persist, so a huge title can't bloat the doc. */
const MAX_STR = 300;

function clip(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > MAX_STR ? `${s.slice(0, MAX_STR - 1)}…` : s;
}

/**
 * Best-effort client IP. Behind Vercel/Cloudflare the left-most entry of
 * x-forwarded-for is the original client; everything after is proxy hops.
 */
function clientIp(request?: Request): string | null {
  if (!request) return null;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return clip(fwd.split(",")[0]);
  return clip(request.headers.get("x-real-ip"));
}

/** Strip anything that looks like a secret before it reaches the log. */
const SENSITIVE_KEY = /pass|secret|token|key|auth|credential/i;

function sanitizeDetail(
  detail: RecordAuditInput["detail"],
): AuditEntry["detail"] {
  if (!detail) return null;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(detail)) {
    if (SENSITIVE_KEY.test(k)) continue;
    if (v === null || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (typeof v === "string") {
      out[k] = clip(v);
    }
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Append one entry. Never throws — callers can `void recordAudit(...)` without
 * a catch and without awaiting, and a failure here can never fail their request.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    const entry: Omit<AuditEntry, "id"> = {
      actorUid: input.actor.uid,
      actorEmail: input.actor.email ?? null,
      action: input.action,
      resource: input.resource,
      target: clip(input.target),
      targetId:
        input.targetId === null || input.targetId === undefined
          ? null
          : clip(String(input.targetId)),
      status: input.status ?? "success",
      detail: sanitizeDetail(input.detail ?? null),
      ip: clientIp(input.request),
      userAgent: clip(input.request?.headers.get("user-agent")),
      at: Date.now(),
    };

    const db = getAdminDb();
    await db.collection(AUDIT_COLLECTION).add(entry);
  } catch (err) {
    console.error(
      "[audit] failed to record entry:",
      err instanceof Error ? err.message : err,
    );
  }
}

export interface ListAuditOptions {
  limit?: number;
  /** Epoch ms cursor — return entries strictly older than this. */
  before?: number;
  actorEmail?: string;
  action?: string;
  resource?: string;
}

export interface ListAuditResult {
  entries: AuditEntry[];
  /** Cursor for the next page, or null when the list is exhausted. */
  nextBefore: number | null;
}

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Read a page of entries, newest first.
 *
 * Only `at` is ordered in Firestore; the actor/action/resource filters are
 * applied in memory afterwards. That deliberately avoids requiring a composite
 * index per filter combination — this collection is small and admin-only, and a
 * missing index would surface as a runtime 500 rather than a degraded list.
 */
export async function listAudit(
  options: ListAuditOptions = {},
): Promise<ListAuditResult> {
  const limit = Math.min(
    Math.max(1, options.limit ?? DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );

  const db = getAdminDb();
  let query = db
    .collection(AUDIT_COLLECTION)
    .orderBy("at", "desc") as FirebaseFirestore.Query;

  if (typeof options.before === "number" && Number.isFinite(options.before)) {
    query = query.where("at", "<", options.before);
  }

  const hasFilters = Boolean(
    options.actorEmail || options.action || options.resource,
  );
  // Over-fetch when filtering in memory so a filtered page still tends to fill.
  const fetchSize = hasFilters ? Math.min(limit * 8, 500) : limit + 1;

  const snap = await query.limit(fetchSize).get();

  let rows: AuditEntry[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AuditEntry, "id">),
  }));

  if (options.actorEmail) {
    const needle = options.actorEmail.toLowerCase();
    rows = rows.filter((r) => (r.actorEmail ?? "").toLowerCase() === needle);
  }
  if (options.action) {
    rows = rows.filter((r) => r.action === options.action);
  }
  if (options.resource) {
    rows = rows.filter((r) => r.resource === options.resource);
  }

  const page = rows.slice(0, limit);
  // Exhausted only when the unfiltered read came up short; a filtered page that
  // fills exactly could still have more behind it.
  const exhausted = snap.size < fetchSize && rows.length <= limit;
  const nextBefore =
    exhausted || page.length === 0 ? null : page[page.length - 1].at;

  return { entries: page, nextBefore };
}

/** Distinct actor emails present in the log, for the filter dropdown. */
export async function listAuditActors(max = 500): Promise<string[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(AUDIT_COLLECTION)
    .orderBy("at", "desc")
    .limit(max)
    .get();

  const seen = new Set<string>();
  for (const d of snap.docs) {
    const email = (d.data() as Omit<AuditEntry, "id">).actorEmail;
    if (email) seen.add(email);
  }
  return [...seen].sort();
}
