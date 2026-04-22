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
 * Report error to monitoring service (not implemented yet)
 * This is where you would send production errors to services like Sentry, LogRocket, etc.
 */
export function reportError(
  error: Error | unknown,
  context?: Record<string, unknown>,
): void {
  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { contexts: { custom: context } });

  // For now, just dev log
  if (process.env.NODE_ENV === "development") {
    console.error("Error reported:", error, context);
  }
}
