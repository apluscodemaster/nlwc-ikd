import type { AudioSermon, AudioSermonsResponse, SeriesItem, SpeakerItem, TopicItem } from "~/shared";
import { api } from "./client";

export interface AudioSermonQuery {
  page?: number;
  perPage?: number;
  search?: string;
  seriesId?: number;
  speakerId?: number;
  topicId?: number;
  year?: number;
}

export const sermonsApi = {
  list: (q: AudioSermonQuery, signal?: AbortSignal) =>
    api.get<AudioSermonsResponse>(
      "/api/audio-sermons",
      {
        page: q.page ?? 1,
        per_page: q.perPage ?? 12,
        search: q.search,
        series_id: q.seriesId,
        speaker_id: q.speakerId,
        topic_id: q.topicId,
        year: q.year,
      },
      signal,
    ),

  /** Full detail, including `downloadUrl` (the playable audio). */
  detail: (id: number, signal?: AbortSignal) =>
    api.get<AudioSermon>("/api/audio-sermons", { message_id: id }, signal),

  series: () => api.get<SeriesItem[]>("/api/audio-sermons/filters", { type: "series" }),
  speakers: () => api.get<SpeakerItem[]>("/api/audio-sermons/filters", { type: "speakers" }),
  topics: () => api.get<TopicItem[]>("/api/audio-sermons/filters", { type: "topics" }),
};
