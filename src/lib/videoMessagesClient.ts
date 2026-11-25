import type { VideoMessage } from "@/lib/videoMessages";

export type { VideoMessage };

/** React Query key for the video message list, shared by every page that shows it. */
export const VIDEO_MESSAGES_QUERY_KEY = ["video-messages"] as const;

/** Browser fetch of every video message (GET /api/video-messages). */
export async function fetchVideoMessages(): Promise<VideoMessage[]> {
  const res = await fetch("/api/video-messages");
  if (!res.ok) throw new Error("Failed to fetch video messages");
  const data = (await res.json()) as { messages?: VideoMessage[] };
  return data.messages ?? [];
}
