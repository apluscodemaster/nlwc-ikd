import type { VideoMessage } from "~/shared";
import { api } from "./client";

export interface VideoStreamInfo {
  url: string | null;
  /** YouTube video id when the sheet holds a video/live link */
  videoId?: string | null;
  /** YouTube channel id when it holds a channel link (live via /embed/live_stream) */
  channelId?: string | null;
  /** Ready-to-embed URL (channel live_stream, video, or the raw link) */
  embedUrl?: string;
  error?: string;
}

export const videoApi = {
  messages: async (signal?: AbortSignal) =>
    (await api.get<{ messages: VideoMessage[] }>("/api/video-messages", undefined, signal)).messages ?? [],
  /** Current live-stream link from the admin's Google Sheet. 404 = none set. */
  stream: (signal?: AbortSignal) => api.get<VideoStreamInfo>("/api/video-stream", undefined, signal),
};

export function youtubeThumb(id: string, quality: "hq" | "mq" | "maxres" = "hq"): string {
  return `https://i.ytimg.com/vi/${id}/${quality === "maxres" ? "maxresdefault" : `${quality}default`}.jpg`;
}
