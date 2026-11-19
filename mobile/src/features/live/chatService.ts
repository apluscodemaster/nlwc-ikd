/**
 * Live chat — port of the website's lib/liveChatService.ts (same Firestore
 * collection, query, colours and validation; see firestore.rules
 * isValidChatMessage). Shows only the current service's newest 200 messages.
 */
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { getChatUid, getDb } from "~/lib/firebase";
import { getLiveServiceStartTime } from "~/shared";

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  color: string;
}

const CHAT_COLLECTION = "live-chat";
/** One stamp per sender; the rules allow a new one every 3 s (firestore.rules). */
const THROTTLE_COLLECTION = "live-chat-throttle";
export const CHAT_COOLDOWN_MS = 3000;
let lastSentAt = 0;

export type SendResult = "sent" | "too-fast" | "invalid" | "failed";
const MAX_MESSAGES = 200;
export const MAX_NAME = 50;
export const MAX_MESSAGE = 500;

const COLORS = [
  "#E53935",
  "#D81B60",
  "#8E24AA",
  "#5E35B1",
  "#3949AB",
  "#1E88E5",
  "#039BE5",
  "#00ACC1",
  "#00897B",
  "#43A047",
  "#7CB342",
  "#C0CA33",
  "#FDD835",
  "#FFB300",
  "#FB8C00",
  "#F4511E",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function subscribeToChat(onMessages: (m: ChatMessage[]) => void, onError?: (e: Error) => void): () => void {
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

/**
 * Post a message. It is written together with this phone's throttle stamp,
 * so the rules can hold each sender to one message every 3 seconds.
 */
export async function sendChat(name: string, message: string): Promise<SendResult> {
  const n = name.trim().slice(0, MAX_NAME);
  const m = message.trim();
  if (!n || !m || m.length > MAX_MESSAGE) return "invalid";
  if (Date.now() - lastSentAt < CHAT_COOLDOWN_MS) return "too-fast";
  try {
    const uid = await getChatUid();
    const db = getDb();
    const batch = writeBatch(db);
    batch.set(doc(db, THROTTLE_COLLECTION, uid), { lastAt: serverTimestamp() });
    batch.set(doc(collection(db, CHAT_COLLECTION)), {
      name: n,
      message: m,
      timestamp: Date.now(),
      color: colorForName(n),
      uid,
    });
    await batch.commit();
    lastSentAt = Date.now();
    return "sent";
  } catch (e) {
    // permission-denied is almost always the 3-second limit.
    return (e as { code?: string }).code === "permission-denied" ? "too-fast" : "failed";
  }
}
