import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Images, X } from "~/components/icons";
import { ChipRow, EmptyState, ErrorState, IconButton, LoadingState, Text } from "~/components";
import { useGallery } from "~/hooks/useGallery";
import { formatCompactDate } from "~/lib/dates";
import { sizedGoogleImage } from "~/shared";
import { spacing } from "~/theme";

const COLS = 3;

/**
 * Church gallery from Google Sheets (web /gallery): grouped by event date,
 * newest first. `?date=YYYY-MM-DD` opens a specific event (from Home).
 */
export default function GalleryScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ date?: string; photo?: string }>();
  const q = useGallery();
  const [date, setDate] = useState<string | null>(params.date ?? null);
  const [viewer, setViewer] = useState<number | null>(params.photo != null ? Number(params.photo) : null);

  // The sheet arrives oldest-first; show the newest event first.
  const dates = useMemo(() => [...(q.data ?? [])].reverse(), [q.data]);
  const active = dates.find((d) => d.date === date) ?? dates[0];
  const images = useMemo(() => (active?.images ?? []).filter(Boolean), [active]);
  const tile = Math.floor((width - spacing.gutter * 2 - spacing.xxs * (COLS - 1)) / COLS);

  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Church Gallery" }} />
      {dates.length === 0 ? (
        <EmptyState icon={Images} title="No photos yet" />
      ) : (
        <FlatList
          data={images}
          numColumns={COLS}
          keyExtractor={(u, i) => `${i}-${u}`}
          columnWrapperStyle={{ gap: spacing.xxs }}
          contentContainerStyle={{ padding: spacing.gutter, gap: spacing.xxs, paddingBottom: spacing.huge }}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.sm }}>
              <ChipRow
                options={dates.map((d) => ({ value: d.date, label: formatCompactDate(d.date) }))}
                value={active?.date ?? ""}
                onChange={(d) => setDate(d)}
              />
              <Text variant="small" color="textMuted">
                {images.length} photo{images.length === 1 ? "" : "s"}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => setViewer(index)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo ${index + 1} of ${images.length}`}
            >
              <Image
                source={{ uri: sizedGoogleImage(item, 400) }}
                style={{ width: tile, height: tile, borderRadius: 6 }}
                contentFit="cover"
                transition={150}
                recyclingKey={item}
              />
            </Pressable>
          )}
        />
      )}

      <Modal visible={viewer != null} animationType="fade" onRequestClose={() => setViewer(null)} statusBarTranslucent>
        <SafeAreaView style={styles.viewer}>
          <IconButton
            icon={X}
            accessibilityLabel="Close photo"
            onPress={() => setViewer(null)}
            tint="#FFFFFF"
            style={styles.close}
          />
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={viewer ?? 0}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(u, i) => `v-${i}-${u}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Image
                source={{ uri: sizedGoogleImage(item, 1600) }}
                style={{ width, height: "100%" }}
                contentFit="contain"
              />
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: "#000" },
  close: { position: "absolute", top: 48, right: 12, zIndex: 2 },
});
