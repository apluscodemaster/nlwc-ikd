/**
 * Rate limiting utilities for API routes
 * Implements simple in-memory rate limiting with IP-based tracking
 * For production, consider using Vercel's built-in ratelimit or external service
 */

import { NextRequest, NextResponse } from "next/server";

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

/**
 * Get client IP from request
 * Checks X-Forwarded-For header first (for proxies), then connection IP
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    (forwarded
      ? forwarded.split(",")[0].trim()
      : request.headers.get("x-real-ip")) || "unknown"
  );
}

/**
 * Check if request is within rate limit
 */
function isWithinRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const windowStart = now - config.windowMs;

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

/**
 * Rate limit middleware for API routes
 * Usage in route: const error = rateLimitMiddleware(request, "public");
 */
export function rateLimitMiddleware(
  request: NextRequest,
  configKey: "public" | "authenticated" | "strict" = "public",
): NextResponse | null {
  const config = DEFAULT_CONFIGS[configKey];
  const clientIp = getClientIp(request);
  const pathname = new URL(request.url).pathname;
  const key = `${clientIp}:${pathname}`;

  if (!isWithinRateLimit(key, config)) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(config.windowMs / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(config.windowMs / 1000).toString(),
        },
      },
    );
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
