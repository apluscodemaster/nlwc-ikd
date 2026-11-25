/**
 * Rate limiting utilities for API routes.
 *
 * Uses a shared Upstash Redis store when configured (see "Shared store"
 * below), otherwise a per-instance in-memory sliding window.
 */

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getClientIp } from "@/lib/clientIp";

// Simple in-memory store for rate limit tracking
// Format: { "ip:endpoint": [timestamp1, timestamp2, ...] }
const rateLimitStore: Record<string, number[]> = {};

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds (e.g., 60000 for 1 minute)
  maxRequests: number; // Max requests per window
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  public: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute for public endpoints
  authenticated: { windowMs: 60000, maxRequests: 1000 }, // 1000 requests per minute for authenticated
  strict: { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute for sensitive endpoints like auth
};

/** Client IP for the rate-limit key (see lib/clientIp.ts for why not the first x-forwarded-for). */
function rateLimitIp(request: NextRequest): string {
  return getClientIp(request) || "unknown";
}

/**
 * Opportunistic sweep of the in-memory store.
 *
 * `cleanupRateLimitStore` was exported for "a cron job" that never existed, so
 * every distinct `ip:path` key stayed in memory for the life of the instance —
 * an unbounded leak on a long-lived server, and wasted work per request as the
 * filter below walked ever-larger arrays. Sweeping lazily (at most once a
 * minute, on a request that is already doing this work) keeps it bounded
 * without a timer, which a serverless runtime would not honour anyway.
 */
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function maybeSweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  // Longest window in DEFAULT_CONFIGS; anything older can never matter.
  cleanupRateLimitStore(SWEEP_INTERVAL_MS);
}

/**
 * Check if request is within rate limit
 */
function isWithinRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  maybeSweep(now);

  // Initialize if not exists
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = [];
  }

  // Remove old timestamps outside the window
  rateLimitStore[key] = rateLimitStore[key].filter(
    (time) => time > windowStart,
  );

  // Check if under limit
  if (rateLimitStore[key].length < config.maxRequests) {
    rateLimitStore[key].push(now);
    return true;
  }

  return false;
}

// ── Shared store (Upstash Redis) ─────────────────────────────────────────────
//
// The in-memory store above lives in ONE serverless instance: on Vercel each
// warm instance counts separately and resets on every cold start, so the real
// ceiling is N × the limit. With Upstash Redis configured, every instance
// shares one counter. Env names: UPSTASH_REDIS_REST_URL/_TOKEN, or the
// KV_REST_API_URL/_TOKEN that Vercel's Upstash integration sets. Unset → the
// in-memory limiter keeps working exactly as before.

type Tier = "public" | "authenticated" | "strict";

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

const sharedLimiters = new Map<Tier, Ratelimit>();

function sharedLimiter(tier: Tier): Ratelimit | null {
  if (!redis) return null;
  let limiter = sharedLimiters.get(tier);
  if (!limiter) {
    const config = DEFAULT_CONFIGS[tier];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.maxRequests,
        `${Math.round(config.windowMs / 1000)} s`,
      ),
      prefix: `nlwc:rl:${tier}`,
      // A slow or unreachable Redis must never take the site down: after
      // this long the request is allowed.
      timeout: 1000,
    });
    sharedLimiters.set(tier, limiter);
  }
  return limiter;
}

function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: { "Retry-After": retryAfterSeconds.toString() },
    },
  );
}

/**
 * Rate limit middleware for API routes.
 * Usage in route:
 *   const limited = await rateLimitMiddleware(request, "public");
 *   if (limited) return limited;
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  configKey: Tier = "public",
  /**
   * Counter to charge, instead of the request path. Dynamic routes must pass
   * one: keyed by path, every distinct value (e.g. each verse reference at
   * /api/scripture/[reference]) got its own allowance, i.e. no limit at all.
   */
  bucket?: string,
): Promise<NextResponse | null> {
  const config = DEFAULT_CONFIGS[configKey];
  const clientIp = rateLimitIp(request);
  const pathname = bucket ?? new URL(request.url).pathname;
  const key = `${clientIp}:${pathname}`;

  const shared = sharedLimiter(configKey);
  if (shared) {
    try {
      const { success, reset } = await shared.limit(key);
      if (success) return null;
      return tooManyRequests(
        Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      );
    } catch (err) {
      // Redis error — fall back to this instance's own counter below.
      console.warn("[rateLimit] shared store failed, using in-memory:", err);
    }
  }

  if (!isWithinRateLimit(key, config)) {
    return tooManyRequests(Math.ceil(config.windowMs / 1000));
  }

  return null;
}

/**
 * Clean up old entries from rate limit store (call periodically to prevent memory leak)
 * Run this via cron job or scheduled task
 */
export function cleanupRateLimitStore(olderThanMs: number = 3600000) {
  // Default: clean entries older than 1 hour
  const threshold = Date.now() - olderThanMs;

  Object.keys(rateLimitStore).forEach((key) => {
    rateLimitStore[key] = rateLimitStore[key].filter(
      (time) => time > threshold,
    );

    // Remove key if empty
    if (rateLimitStore[key].length === 0) {
      delete rateLimitStore[key];
    }
  });
}
