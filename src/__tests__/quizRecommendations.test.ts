import { beforeEach, describe, expect, it, vi } from "vitest";

const { search } = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock("@/lib/audioSermons", () => ({
  getAudioSermons: (...args: unknown[]) => search(...args),
  getAudioSermonDetail: async (id: number) => ({ id, title: `Sermon ${id}` }),
}));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => ({}) }));
// No transcript title from WordPress: the title comes from the slug.
vi.mock("@/lib/wordpress", () => ({ getTranscriptBySlug: async () => null }));

import { getRecommendations } from "@/lib/quizService";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("getRecommendations", () => {
  beforeEach(() => search.mockReset());

  it("looks sermons up in parallel, keeps the order and stops at six", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    search.mockImplementation(async (opts?: { search?: string }) => {
      const q = opts?.search ?? "";
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await delay(20);
      inFlight--;
      return { data: [{ id: q.length, title: q }] };
    });
    const refs = ["alpha", "beta-two", "gamma", "delta", "epsilon", "zeta", "eta", "theta"].map((slug) => ({
      slug: `${slug}-${Date.now()}`,
      category: "Bible Study",
    }));
    const recs = await getRecommendations([], refs);
    expect(recs).toHaveLength(6);
    expect(recs.map((r) => r.read_url)).toEqual(refs.slice(0, 6).map((r) => `/transcripts/${r.slug}`));
    expect(maxInFlight).toBeGreaterThan(1);
  }, 30_000);

  it("caches a found sermon but retries a failed lookup", async () => {
    const slug = `cache-me-${Date.now()}`;
    search.mockResolvedValue({ data: [{ id: 7, title: "Cache Me" }] });
    await getRecommendations([], [{ slug, category: "Bible Study" }]);
    await getRecommendations([], [{ slug, category: "Bible Study" }]);
    expect(search).toHaveBeenCalledTimes(1);

    const missing = `not-found-${Date.now()}`;
    search.mockResolvedValue({ data: [] });
    const [first] = await getRecommendations([], [{ slug: missing, category: "Bible Study" }]);
    // No matching audio: no audio link (it used to be a search page, or worse,
    // the first search result), but the transcript is still offered.
    expect(first.listen_url).toBeUndefined();
    expect(first.read_url).toBe(`/transcripts/${missing}`);
    await delay(0);
    await getRecommendations([], [{ slug: missing, category: "Bible Study" }]);
    expect(search).toHaveBeenCalledTimes(3);
  });

  it("resolves numeric sermon ids to their titles", async () => {
    const [rec] = await getRecommendations([], [{ slug: "4242", category: "Sunday Message" }]);
    expect(rec).toMatchObject({ title: "Sermon 4242", listen_url: "/sermons/audio/4242" });
  });
});
