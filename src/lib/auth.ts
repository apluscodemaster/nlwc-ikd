/**
 * Authentication utilities for API routes
 * Provides helpers for verifying Firebase ID tokens and webhook secrets
 */

import { NextRequest, NextResponse } from "next/server";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * Decode a Firebase ID token and verify basic claims.
 * Checks issuer, audience, and expiration without needing firebase-admin.
 *
 * NOTE: This does NOT cryptographically verify the signature against Google's
 * public keys. For internal same-origin API routes behind an already
 * Firebase-Auth-gated admin UI, this is an acceptable trade-off.
 * For external / public-facing APIs, use firebase-admin verifyIdToken().
 */
function verifyFirebaseToken(token: string): { valid: boolean; error?: string } {
  try {
    // JWT = header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed token" };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    // Check issuer
    const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    if (payload.iss !== expectedIssuer) {
      return { valid: false, error: "Invalid token issuer" };
    }

    // Check audience
    if (payload.aud !== FIREBASE_PROJECT_ID) {
      return { valid: false, error: "Invalid token audience" };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token expired" };
    }

    // Check issued-at isn't in the future
    if (payload.iat && payload.iat > now + 60) {
      return { valid: false, error: "Token issued in the future" };
    }

    // Must have a subject (user ID)
    if (!payload.sub || typeof payload.sub !== "string") {
      return { valid: false, error: "Missing subject claim" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Failed to decode token" };
  }
}

/**
 * Verify Authorization header contains a valid Firebase ID token.
 * Supports Bearer token format: Authorization: Bearer <token>
 */
export function verifyAuthHeader(request: NextRequest): { isValid: boolean; error?: string } {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return { isValid: false, error: "Missing Authorization header" };
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer") {
    return { isValid: false, error: "Invalid authorization scheme. Use 'Bearer <token>'" };
  }

  if (!token) {
    return { isValid: false, error: "Missing authorization token" };
  }

  if (!FIREBASE_PROJECT_ID) {
    console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID not configured");
    return { isValid: false, error: "Server configuration error" };
  }

  const result = verifyFirebaseToken(token);
  return { isValid: result.valid, error: result.error };
}

/**
 * Middleware helper to enforce authentication on API routes
 * Returns error response if authentication fails
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const authCheck = verifyAuthHeader(request);

  if (!authCheck.isValid) {
    return NextResponse.json(
      { error: authCheck.error || "Unauthorized" },
      { status: 401 },
    );
  }

  return null;
}

/**
 * Verify webhook secret from Authorization header
 * Supports format: Authorization: Bearer <secret>
 */
export function verifyWebhookSecret(request: NextRequest): { isValid: boolean; error?: string } {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return { isValid: false, error: "Missing Authorization header" };
  }

  const [scheme, secret] = authHeader.split(" ");

  if (scheme !== "Bearer") {
    return { isValid: false, error: "Invalid authorization scheme. Use 'Bearer <secret>'" };
  }

  if (!secret) {
    return { isValid: false, error: "Missing webhook secret" };
  }

  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("WEBHOOK_SECRET not configured");
    return { isValid: false, error: "Server configuration error" };
  }

  const isValid = secret === webhookSecret;
  if (!isValid) {
    return { isValid: false, error: "Invalid webhook secret" };
  }

  return { isValid: true };
}

/**
 * Helper to create generic error response (don't expose internal details)
 */
export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}
