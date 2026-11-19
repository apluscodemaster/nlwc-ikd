/**
 * Live chat — port of the website's lib/liveChatService.ts (same Firestore
 * collection, query, colours and validation; see firestore.rules
 * isValidChatMessage). Shows only the current service's newest 200 messages.
 */
import { addDoc, collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getDb } from "~/lib/firebase";
import { getLiveServiceStartTime } from "~/shared";

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  color: string;
}

const CHAT_COLLECTION = "live-chat";
const MAX_MESSAGES = 200;
export const MAX_NAME = 50;
export const MAX_MESSAGE = 500;

const COLORS = [
  "#E53935", "#D81B60", "#8E24AA", "#5E35B1", "#3949AB", "#1E88E5", "#039BE5", "#00ACC1",
  "#00897B", "#43A047", "#7CB342", "#C0CA33", "#FDD835", "#FFB300", "#FB8C00", "#F4511E",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function subscribeToChat(
  onMessages: (m: ChatMessage[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const serviceStart = getLiveServiceStartTime();
  if (serviceStart === null) {
    onMessages([]);
    return () => {};
  }
  const q = query(
    collection(getDb(), CHAT_COLLECTION),
    where("timestamp", ">=", serviceStart),
    orderBy("timestamp", "desc"),
    limit(MAX_MESSAGES),
  );
  return onSnapshot(
    q,
    (snap) => {
      // Newest first from Firestore; the inverted FlatList shows it bottom-up.
      onMessages(
        snap.docs.map((d) => {
          const v = d.data();
          return { id: d.id, name: v.name, message: v.message, timestamp: v.timestamp, color: v.color };
        }),
      );
    },
    (e) => onError?.(e),
  );
}

export async function sendChat(name: string, message: string): Promise<boolean> {
  const n = name.trim().slice(0, MAX_NAME);
  const m = message.trim();
  if (!n || !m || m.length > MAX_MESSAGE) return false;
  try {
    await addDoc(collection(getDb(), CHAT_COLLECTION), {
      name: n,
      message: m,
      timestamp: Date.now(),
      color: colorForName(n),
    });
    return true;
  } catch {
    return false;
  }
}
