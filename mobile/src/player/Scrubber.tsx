import { useState } from "react";
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Text } from "~/components";
import { useTheme } from "~/theme";
import { formatClock } from "./format";

interface ScrubberProps {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

/**
 * Seek bar. Dragging previews the position locally and seeks once on
 * release, so the audio isn't asked to seek dozens of times per drag.
 * Accessible as an adjustable control (swipe up/down = ±15 s).
 */
export function Scrubber({ position, duration, onSeek }: ScrubberProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [dragAt, setDragAt] = useState<number | null>(null);

  const shown = dragAt ?? position;
  const pct = duration > 0 ? Math.min(1, shown / duration) : 0;

  const toSeconds = (x: number) => (width > 0 ? Math.max(0, Math.min(1, x / width)) * duration : 0);

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => duration > 0,
    onMoveShouldSetPanResponder: () => duration > 0,
    onPanResponderGrant: (e) => setDragAt(toSeconds(e.nativeEvent.locationX)),
    onPanResponderMove: (e) => setDragAt(toSeconds(e.nativeEvent.locationX)),
    onPanResponderRelease: (e) => {
      onSeek(toSeconds(e.nativeEvent.locationX));
      setDragAt(null);
    },
    onPanResponderTerminate: () => setDragAt(null),
  });

  return (
    <View>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={styles.hit}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Playback position"
        accessibilityValue={{ text: `${formatClock(shown)} of ${formatClock(duration)}` }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) =>
          onSeek(Math.max(0, Math.min(duration, position + (e.nativeEvent.actionName === "increment" ? 15 : -15))))
        }
        {...responder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: Math.max(0, pct * width - 8), backgroundColor: colors.primary }]}
        />
      </View>
      <View style={styles.times}>
        <Text variant="small" color="textSecondary">
          {formatClock(shown)}
        </Text>
        <Text variant="small" color="textSecondary">
          {duration > 0 ? `-${formatClock(duration - shown)}` : "--:--"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 32, justifyContent: "center" },
  track: { height: 4, borderRadius: 2, overflow: "hidden" },
  fill: { height: 4 },
  thumb: { position: "absolute", width: 16, height: 16, borderRadius: 8, top: 8 },
  times: { flexDirection: "row", justifyContent: "space-between" },
});
