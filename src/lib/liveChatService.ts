/**
 * Live Chat Service — Firestore-backed
 *
 * Stores chat messages in the `live-chat` Firestore collection.
 * All users share the same collection, so messages are globally visible
 * across all serverless instances and browser tabs in real time.
 *
 * Messages older than 24 hours are automatically pruned on read.
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

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
 * Only fetches messages from the last 24 hours.
 */
export function subscribeToChatMessages(
  onMessages: (messages: ChatMessage[]) => void,
): () => void {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  const q = query(
    collection(db, CHAT_COLLECTION),
    where("timestamp", ">", twentyFourHoursAgo),
    orderBy("timestamp", "asc"),
    limit(MAX_MESSAGES),
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        message: doc.data().message,
        timestamp: doc.data().timestamp,
        color: doc.data().color,
      }));
      onMessages(messages);
    },
    (error) => {
      console.warn("Live chat listener error:", error);
    },
  );

  return unsubscribe;
}

/**
 * Send a new chat message to Firestore.
 * Returns the created message or null on error.
 */
export async function sendChatMessage(
  name: string,
  message: string,
): Promise<ChatMessage | null> {
  try {
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) return null;
    if (trimmedMessage.length > 500) return null;

    const chatMsg = {
      name: trimmedName,
      message: trimmedMessage,
      timestamp: Date.now(),
      color: getColorForName(trimmedName),
    };

    const docRef = await addDoc(collection(db, CHAT_COLLECTION), chatMsg);

    return {
      id: docRef.id,
      ...chatMsg,
    };
  } catch (error) {
    console.warn("Failed to send chat message:", error);
    return null;
  }
}
