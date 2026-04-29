/**
 * Authentication utilities for API routes
 * Provides helpers for verifying authorization headers and API keys
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Verify Authorization header contains valid API key or JWT token
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

  // Verify token matches admin secret
  const adminSecret = process.env.ADMIN_API_KEY;
  if (!adminSecret) {
    console.error("ADMIN_API_KEY not configured");
    return { isValid: false, error: "Server configuration error" };
  }

  const isValid = token === adminSecret;
  if (!isValid) {
    return { isValid: false, error: "Invalid authorization token" };
  }

  return { isValid: true };
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
