import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SegmentedControl } from "~/components";
import { AudioMessages } from "~/features/sermons/AudioMessages";
import { VideoMessages } from "~/features/video/VideoMessages";
import { spacing, useTheme } from "~/theme";

type Segment = "audio" | "video";

/** Listen tab: audio messages and video messages (web /sermons, /video-messages). */
export default function ListenTab() {
  const { colors } = useTheme();
  const [segment, setSegment] = useState<Segment>("audio");
  // ?q=… (from /sermons?q=… links, e.g. quiz recommendations) opens the
  // audio list already searched.
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    if (q) setSegment("audio");
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.sm }}>
        <SegmentedControl
          segments={[
            { value: "audio", label: "Audio" },
            { value: "video", label: "Video" },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>
      {segment === "audio" ? <AudioMessages key={q ?? ""} initialSearch={q} /> : <VideoMessages />}
    </SafeAreaView>
  );
}
