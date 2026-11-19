/**
 * Live Chat Service — Firestore-backed
 *
 * Stores chat messages in the `live-chat` Firestore collection.
 * All users share the same collection, so messages are globally visible
 * across all serverless instances and browser tabs in real time.
 *
 * Messages are scoped to the current service window: only messages sent
 * since the current meeting started are shown. If no service is live,
 * no messages are displayed.
 */

import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  limit,
  writeBatch,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "./firebase";
import { getLiveServiceStartTime } from "./liveSchedule";

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number; // Unix ms
  color: string;
}

const CHAT_COLLECTION = "live-chat";
const MAX_MESSAGES = 200;

// Predefined avatar colors for variety
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

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * Subscribe to live chat messages in real time.
 * Returns an unsubscribe function.
 * Only fetches messages from the current service window.
 * If no service is live, returns an empty list.
 */
export function subscribeToChatMessages(
  onMessages: (messages: ChatMessage[]) => void,
): () => void {
  const serviceStart = getLiveServiceStartTime();

  // No service is live — return empty and provide a no-op unsubscribe
  if (serviceStart === null) {
    onMessages([]);
    return () => {};
  }

  // Newest-first so the limit keeps the LATEST messages. Ascending + limit
  // kept the oldest 200 instead, so once a busy service passed 200 messages
  // every new one silently stopped appearing.
  const q = query(
    collection(db, CHAT_COLLECTION),
    where("timestamp", ">=", serviceStart),
    orderBy("timestamp", "desc"),
    limit(MAX_MESSAGES),
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          message: doc.data().message,
          timestamp: doc.data().timestamp,
          color: doc.data().color,
        }))
        // Back to oldest-first for display (newest at the bottom).
        .reverse();
      onMessages(messages);
    },
    (error) => {
      console.warn("Live chat listener error:", error);
    },
  );

  return unsubscribe;
}

/** Throttle collection (see firestore.rules: one post per 3 s per sender). */
const THROTTLE_COLLECTION = "live-chat-throttle";
/** Matches the rules; the page waits this long itself so it never trips them. */
export const CHAT_COOLDOWN_MS = 3000;
let lastSentAt = 0;

/**
 * The poster's identity for the rate limit: the signed-in user (an admin), or
 * an anonymous Firebase sign-in made silently the first time someone posts.
 * Anonymous sign-ins can't use any admin tools (rules + lib/auth.ts).
 */
async function chatUid(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

export type SendChatResult =
  | { ok: true; message: ChatMessage }
  | { ok: false; reason: "too-fast" | "invalid" | "failed" };

/**
 * Send a chat message. The message and the sender's throttle stamp are
 * written together, so the rules can hold each sender to one message every
 * 3 seconds.
 */
export async function sendChatMessage(
  name: string,
  message: string,
): Promise<SendChatResult> {
  const trimmedName = name.trim();
  const trimmedMessage = message.trim();
  if (!trimmedName || !trimmedMessage || trimmedMessage.length > 500) {
    return { ok: false, reason: "invalid" };
  }
  if (Date.now() - lastSentAt < CHAT_COOLDOWN_MS) {
    return { ok: false, reason: "too-fast" };
  }

  try {
    const uid = await chatUid();
    const chatMsg = {
      name: trimmedName,
      message: trimmedMessage,
      timestamp: Date.now(),
      color: getColorForName(trimmedName),
    };
    const msgRef = doc(collection(db, CHAT_COLLECTION));
    const batch = writeBatch(db);
    batch.set(doc(db, THROTTLE_COLLECTION, uid), { lastAt: serverTimestamp() });
    batch.set(msgRef, { ...chatMsg, uid });
    await batch.commit();
    lastSentAt = Date.now();
    return { ok: true, message: { id: msgRef.id, ...chatMsg } };
  } catch (error) {
    // permission-denied here is almost always the 3-second limit.
    const code = (error as { code?: string }).code;
    if (code === "permission-denied") return { ok: false, reason: "too-fast" };
    console.warn("Failed to send chat message:", error);
    return { ok: false, reason: "failed" };
  }
}
