import type { Instrumentation } from "next";

/**
 * Every error thrown while the server renders a page, runs a route handler
 * or a server action ends up here (Next's onRequestError hook), and is
 * written to the host's function logs as ONE line of JSON, so it can be
 * searched and alerted on in Netlify → Logs instead of getting lost.
 *
 * This is also the hook an error-tracking service plugs into: with
 * @sentry/nextjs installed, export its captureRequestError from here.
 */
export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error(
    JSON.stringify({
      level: "error",
      source: "onRequestError",
      message: error.message,
      // Next's digest: the id shown to the visitor on the error page.
      digest: (err as { digest?: string }).digest,
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: (context as { renderSource?: string }).renderSource,
      stack: error.stack?.split("\n").slice(0, 8).join("\n"),
      at: new Date().toISOString(),
    }),
  );
};
