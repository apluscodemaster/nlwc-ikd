import { useState } from "react";
import { View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { IconButton, SegmentedControl } from "~/components";
import { DevotionalList } from "~/features/reader/DevotionalList";
import { ManualList } from "~/features/reader/ManualList";
import { TranscriptList } from "~/features/reader/TranscriptList";
import { spacing, useTheme } from "~/theme";

type Segment = "transcripts" | "manuals" | "devotionals";

/** Read tab: transcripts, Sunday School manuals, devotionals + Bible search. */
export default function ReadTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>("transcripts");

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <IconButton icon={Search} accessibilityLabel="Search the Bible" color="primary" onPress={() => router.push("/bible")} />
          ),
        }}
      />
      <View style={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.sm }}>
        <SegmentedControl
          segments={[
            { value: "transcripts", label: "Transcripts" },
            { value: "manuals", label: "Manuals" },
            { value: "devotionals", label: "Devotionals" },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>
      {segment === "transcripts" ? <TranscriptList /> : segment === "manuals" ? <ManualList /> : <DevotionalList />}
    </SafeAreaView>
  );
}
