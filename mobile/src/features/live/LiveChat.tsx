import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from "react-native";
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

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToChat(setMessages, () => setError(true));
  }, []);

  if (!isFirebaseConfigured) {
    return <EmptyState icon={MessageCircle} title="Chat unavailable" message="This build isn't connected to live chat." />;
  }

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const ok = await sendChat(name, text);
    setSending(false);
    if (ok) {
      setText("");
      Haptics.selectionAsync().catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.surfaceMuted, fontFamily: fonts.regular },
  ];

  return (
    <View style={styles.root}>
      {messages === null && !error ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
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
          ListEmptyComponent={
            <Text color="textMuted" align="center" style={{ padding: spacing.lg, transform: [{ scaleY: -1 }] }}>
              {error ? "Chat couldn't connect. It will retry automatically." : "No messages yet. Say hello!"}
            </Text>
          }
        />
      )}

      {name ? (
        <View style={[styles.composer, { borderTopColor: colors.border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`Message as ${name}`}
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_MESSAGE}
            style={inputStyle}
            returnKeyType="send"
            onSubmitEditing={send}
            accessibilityLabel="Chat message"
          />
          <IconButton icon={Send} accessibilityLabel="Send message" onPress={send} filled size={18} disabled={sending} />
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
  root: { flex: 1, minHeight: 320 },
  list: { flex: 1 },
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
