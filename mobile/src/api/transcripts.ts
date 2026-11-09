import { getBaseSlug, type TranscriptStub } from "~/shared";
import { api } from "./client";

interface StubResponse {
  items?: { slug: string; title: string; id: number; categories: number[]; date?: string }[];
}

export const transcriptStubsApi = {
  /**
   * Lightweight list of every transcript (slug, title, date) used to match a
   * sermon to its transcript. Same cached route the website's sermons page
   * uses (/api/wp/transcript-slugs, revalidated hourly).
   */
  stubs: async (): Promise<TranscriptStub[]> => {
    const data = await api.get<StubResponse>("/api/wp/transcript-slugs");
    return (data.items ?? []).map((p) => ({
      slug: p.slug,
      title: p.title,
      id: p.id,
      categories: p.categories,
      date: p.date,
      baseSlug: getBaseSlug(p.slug, p.title),
    }));
  },
};
