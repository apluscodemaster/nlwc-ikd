/**
 * Authentication utilities for API routes
 * Uses Firebase Admin SDK for proper server-side token verification.
 * Falls back to manual JWT decode if Admin SDK is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

/**
 * Verify a Firebase ID token server-side.
 * Primary: Firebase Admin SDK verifyIdToken() (cryptographic verification).
 * Fallback: Manual JWT decode with issuer/audience/expiry checks.
 */
async function verifyFirebaseToken(token: string): Promise<{ valid: boolean; error?: string }> {
  // ── Primary: Firebase Admin SDK ───────────────────────────────────────────
  try {
    const auth = getAdminAuth();
    await auth.verifyIdToken(token);
    return { valid: true };
  } catch (adminError) {
    const msg = adminError instanceof Error ? adminError.message : String(adminError);
    // If the token itself is invalid/expired, don't fall through
    if (msg.includes("expired") || msg.includes("revoked")) {
      return { valid: false, error: "Token expired" };
    }
    if (msg.includes("argument") || msg.includes("Decoding") || msg.includes("malformed")) {
      return { valid: false, error: "Malformed token" };
    }
    // Admin SDK not initialised — fall through to manual decode
    console.warn("[auth] Firebase Admin unavailable, falling back to manual JWT check:", msg);
  }

  // ── Fallback: manual JWT decode ───────────────────────────────────────────
  try {
    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      return { valid: false, error: "Server configuration error: no project ID" };
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed token" };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
      return { valid: false, error: "Invalid token issuer" };
    }
    if (payload.aud !== projectId) {
      return { valid: false, error: "Invalid token audience" };
    }
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token expired" };
    }
    if (payload.iat && payload.iat > now + 60) {
      return { valid: false, error: "Token issued in the future" };
    }
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
export async function verifyAuthHeader(request: NextRequest): Promise<{ isValid: boolean; error?: string }> {
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

  const result = await verifyFirebaseToken(token);
  return { isValid: result.valid, error: result.error };
}

/**
 * Middleware helper to enforce authentication on API routes
 * Returns error response if authentication fails
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const authCheck = await verifyAuthHeader(request);

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
