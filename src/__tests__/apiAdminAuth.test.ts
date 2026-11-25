/// <reference types="vite/client" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Every admin API route must refuse a request that isn't from an
 * administrator, BEFORE touching any data. Three kinds of caller are tried
 * on each route: no token at all, an anonymous Firebase session (what live
 * chat gives every visitor), and a real account without the admin claim
 * (anyone can create one with the public API key).
 *
 * The database and storage are wired to throw if touched, so a route that
 * forgot its auth check fails here even if it would have returned 401 later.
 */

const verifyIdToken = vi.fn();
const touched = vi.fn();
const explode = () => {
  touched();
  throw new Error("data layer touched by an unauthorised request");
};
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: explode,
  getAdminStorage: explode,
}));
vi.mock("@/lib/auditLog", () => ({ recordAudit: vi.fn() }));

type Handler = (req: NextRequest, ctx?: unknown) => Promise<Response>;
type Method = "GET" | "POST" | "PUT" | "DELETE";

/** [route module path under src/app/api, method] */
const ADMIN_ROUTES: [string, Method][] = [
  ["admin/audit-log", "GET"],
  ["admin/audit-log", "POST"],
  ["devotionals/upload", "POST"],
  ["devotionals/delete", "DELETE"],
  ["fellowship", "POST"],
  ["fellowship", "PUT"],
  ["fellowship", "DELETE"],
  ["fellowship/resolve-map", "POST"],
  ["popups/admin", "GET"],
  ["popups/admin", "POST"],
  ["popups/admin", "PUT"],
  ["popups/admin", "DELETE"],
  ["quiz/admin/categories", "POST"],
  ["quiz/admin/categories", "DELETE"],
  ["quiz/admin/questions", "GET"],
  ["quiz/admin/questions", "POST"],
  ["quiz/admin/questions", "PUT"],
  ["quiz/admin/questions", "DELETE"],
  ["quiz/admin/stats", "GET"],
  ["quiz/admin/stats", "DELETE"],
  ["quiz/admin/recovery-code", "POST"],
  ["quiz/admin/security-reset", "POST"],
  ["schedule", "POST"],
  ["schedule", "PUT"],
  ["schedule", "DELETE"],
  ["wp/content", "GET"],
  ["wp/media", "GET"],
  ["wp/publish", "POST"],
  ["wp/update", "PUT"],
  ["wp/upload-media", "POST"],
  ["wp/speakers", "POST"],
  ["wp/transcript-categories", "POST"],
];

const routeModules = import.meta.glob("../app/api/**/route.ts");

async function handler(path: string, method: Method): Promise<Handler> {
  const load = routeModules[`../app/api/${path}/route.ts`];
  if (!load) throw new Error(`no route module for ${path}`);
  const mod = (await load()) as Partial<Record<Method, Handler>>;
  const fn = mod[method];
  if (!fn) throw new Error(`${path} has no ${method} handler`);
  return fn;
}

function request(path: string, method: Method, token?: string) {
  const headers = new Headers({ "content-type": "application/json" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new NextRequest(`https://ikorodu.nlwc.church/api/${path}?id=x`, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify({ id: "x", title: "t" }),
  });
}

const ctx = { params: Promise.resolve({}) };

describe.each(ADMIN_ROUTES)("%s %s", (path, method) => {
  beforeEach(() => {
    verifyIdToken.mockReset();
    touched.mockReset();
  });

  it("refuses a request with no token", async () => {
    const res = await (await handler(path, method))(request(path, method), ctx);
    expect(res.status).toBe(401);
    expect(touched).not.toHaveBeenCalled();
  });

  it("refuses an anonymous (live chat) session", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "anon",
      firebase: { sign_in_provider: "anonymous" },
    });
    const res = await (await handler(path, method))(request(path, method, "t.o.k"), ctx);
    expect(res.status).toBe(401);
    expect(touched).not.toHaveBeenCalled();
  });

  it("refuses an account without the admin claim", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "stranger",
      email: "stranger@example.org",
      firebase: { sign_in_provider: "password" },
    });
    const res = await (await handler(path, method))(request(path, method, "t.o.k"), ctx);
    expect(res.status).toBe(401);
    expect(touched).not.toHaveBeenCalled();
  });
});
