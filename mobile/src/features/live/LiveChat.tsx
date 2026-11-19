import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, TextInput, View } from "react-native";
import { FORCE_LIVE } from "~/hooks/useLiveStatus";
import * as Haptics from "expo-haptics";
import { MessageCircle, Send } from "~/components/icons";
import { Button, EmptyState, IconButton, Text } from "~/components";
import { isFirebaseConfigured } from "~/lib/config";
import { kv } from "~/lib/storage";
import { fonts, radius, spacing, useTheme } from "~/theme";
import { MAX_MESSAGE, MAX_NAME, sendChat, subscribeToChat, type ChatMessage } from "./chatService";

const NAME_KEY = "nlwc-chat-name";

function timeLabel(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
  } catch {
    return "";
  }
}

/** Live community chat during services (Firestore realtime, same as web). */
export function LiveChat() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState(false);
  const [name, setName] = useState(() => kv.getString(NAME_KEY) ?? "");
  const [nameDraft, setNameDraft] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToChat(setMessages, () => setError(true));
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <EmptyState icon={MessageCircle} title="Chat unavailable" message="This build isn't connected to live chat." />
    );
  }

  const send = async () => {
    if (!text.trim() || sending) return;
    if (FORCE_LIVE) {
      // Dev "force live" mode: never post test messages to the real chat.
      Alert.alert("Test mode", "Messages aren't sent while EXPO_PUBLIC_FORCE_LIVE is on.");
      setText("");
      return;
    }
    setSending(true);
    setSendError("");
    const result = await sendChat(name, text);
    setSending(false);
    if (result === "sent") {
      setText("");
      Haptics.selectionAsync().catch(() => {});
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    // The text stays, so it can be sent in a moment.
    if (result === "too-fast") setSendError("Please wait a few seconds between messages.");
    else if (result === "failed") setSendError("Couldn't send. Check your connection and try again.");
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.surfaceMuted, fontFamily: fonts.regular },
  ];

  return (
    <View style={styles.root}>
      {messages === null && !error ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
      ) : !messages?.length ? (
        // Rendered outside the inverted list: on RN 0.88 an inverted
        // FlatList's empty component isn't flipped, so counter-flipping it
        // (as before) showed this text upside down.
        <View style={styles.empty}>
          <Text color="textMuted" align="center">
            {error ? "Chat couldn't connect. It will retry automatically." : "No messages yet. Say hello!"}
          </Text>
        </View>
      ) : (
        <FlatList
          inverted
          data={messages ?? []}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={{ paddingVertical: spacing.xs }}
          renderItem={({ item }) => (
            <View style={styles.msg} accessible accessibilityLabel={`${item.name}: ${item.message}`}>
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text variant="label" style={{ color: "#FFFFFF" }}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label" dense>
                  <Text variant="label" style={{ color: item.color }}>
                    {item.name}
                  </Text>
                  <Text variant="small" color="textMuted">
                    {"  "}
                    {timeLabel(item.timestamp)}
                  </Text>
                </Text>
                <Text>{item.message}</Text>
              </View>
            </View>
          )}
        />
      )}

      {name && sendError ? (
        <Text variant="small" color="primary" style={styles.sendError} accessibilityLiveRegion="polite">
          {sendError}
        </Text>
      ) : null}
      {name ? (
        <View style={[styles.composer, { borderTopColor: colors.border }]}>
          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              if (sendError) setSendError("");
            }}
            placeholder={`Message as ${name}`}
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_MESSAGE}
            style={inputStyle}
            returnKeyType="send"
            onSubmitEditing={send}
            accessibilityLabel="Chat message"
          />
          <IconButton
            icon={Send}
            accessibilityLabel="Send message"
            onPress={send}
            filled
            size={18}
            disabled={sending}
          />
        </View>
      ) : (
        <View style={[styles.composer, { borderTopColor: colors.border }]}>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Your name to join the chat"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_NAME}
            style={inputStyle}
            autoComplete="name"
            accessibilityLabel="Your name"
          />
          <Button
            title="Join"
            size="sm"
            disabled={!nameDraft.trim()}
            onPress={() => {
              const n = nameDraft.trim();
              kv.setString(NAME_KEY, n);
              setName(n);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sendError: { paddingHorizontal: spacing.gutter, paddingTop: spacing.xs },
  // No minimum height: the chat must be able to shrink so the composer stays
  // visible above the keyboard.
  root: { flex: 1 },
  list: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", padding: spacing.lg },
  msg: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.gutter },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, minHeight: 40, borderRadius: radius.pill, paddingHorizontal: spacing.md, fontSize: 15 },
});
