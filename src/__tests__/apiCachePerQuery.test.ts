import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The live site's CDN (Netlify) ignores query parameters in its cache key, so
 * a route that reads its query AND asks shared caches to keep the response
 * (s-maxage) serves the first answer to every query. That broke sermon lists,
 * quiz audio and Bible search. See lib/cacheHeaders.ts.
 */
function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return routes(p);
    return name === "route.ts" ? [p] : [];
  });
}

describe("API caching vs query parameters", () => {
  it("no route both reads its query string and sets s-maxage", () => {
    const offenders = routes(join(process.cwd(), "src/app/api")).filter((file) => {
      const src = readFileSync(file, "utf8");
      // Only the GET handler's caching matters; strip other handlers.
      const get = src.slice(src.indexOf("export async function GET"));
      const getBody = get.split(/export async function (POST|PUT|DELETE|PATCH)/)[0];
      return /searchParams/.test(getBody) && /s-maxage/.test(getBody);
    });
    expect(offenders).toEqual([]);
  });
});
