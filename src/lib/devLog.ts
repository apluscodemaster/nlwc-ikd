/**
 * Secure logging utility for development-only debugging
 * Production logs are suppressed to prevent exposing sensitive API details
 */

type LogLevel = "debug" | "warn" | "error";

interface LogOptions {
  includeTimestamp?: boolean;
  tag?: string;
}

/**
 * Log a message only in development mode
 * In production, logs are silently suppressed to prevent exposing sensitive details
 * like API endpoints, database structures, or implementation details
 */
function devLog(
  level: LogLevel,
  message: string,
  data?: unknown,
  options?: LogOptions,
): void {
  // Only log in development mode
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const timestamp = options?.includeTimestamp
    ? `[${new Date().toISOString()}]`
    : "";
  const tag = options?.tag ? `[${options.tag}]` : "";
  const prefix = [timestamp, tag].filter(Boolean).join(" ");
  const logMessage = prefix ? `${prefix} ${message}` : message;

  switch (level) {
    case "debug":
      console.debug(logMessage, data);
      break;
    case "warn":
      console.warn(logMessage, data);
      break;
    case "error":
      console.error(logMessage, data);
      break;
  }
}

/**
 * Log debug message (development only)
 */
export function logDebug(
  message: string,
  data?: unknown,
  options?: LogOptions,
): void {
  devLog("debug", message, data, options);
}

/**
 * Log warning message (development only)
 */
export function logWarn(
  message: string,
  data?: unknown,
  options?: LogOptions,
): void {
  devLog("warn", message, data, options);
}

/**
 * Log error message (development only)
 * IMPORTANT: Never include sensitive details like full URLs, API keys, or implementation details
 */
export function logError(
  message: string,
  data?: unknown,
  options?: LogOptions,
): void {
  devLog("error", message, data, options);
}

/**
 * Report an error that was caught and handled, so it isn't silently lost.
 *
 * Production: one line of JSON on console.error, which on the server lands
 * in the host's function logs (as src/instrumentation.ts does for uncaught
 * ones). An error-tracking service (e.g. Sentry.captureException) would be
 * called here too.
 */
export function reportError(
  error: Error | unknown,
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.error("Error reported:", error, context);
    return;
  }
  const e = error instanceof Error ? error : new Error(String(error));
  console.error(
    JSON.stringify({
      level: "error",
      source: "reportError",
      message: e.message,
      context,
      stack: e.stack?.split("\n").slice(0, 8).join("\n"),
      at: new Date().toISOString(),
    }),
  );
}
