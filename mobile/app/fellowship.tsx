import { useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Clock, LocateFixed, MapPin, MessageCircle, Navigation, User } from "~/components/icons";
import { fellowshipApi } from "~/api/community";
import { Button, Card, EmptyState, ErrorState, ListSkeleton, Screen, SearchField, Text } from "~/components";
import { CHURCH } from "~/lib/config";
import { fellowshipCenters, haversineKm, type FellowshipCenter, type LatLng } from "~/shared";
import { spacing, useTheme } from "~/theme";

/** House fellowship directory with "near me" (web /fellowship + FellowshipPrompt). */
export default function FellowshipScreen() {
  // Static list from the web app is the instant fallback, as on the website.
  const query = useQuery({
    queryKey: ["fellowship-centers"],
    queryFn: fellowshipApi.centers,
    placeholderData: fellowshipCenters,
    staleTime: 60 * 60 * 1000,
  });
  const [me, setMe] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [search, setSearch] = useState("");

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location not allowed", "You can still search for your area by name.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      Alert.alert("Couldn't get your location", "Please try again, or search by area.");
    } finally {
      setLocating(false);
    }
  };

  const centers = useMemo(() => {
    const needle = search.toLowerCase();
    const list = (query.data ?? []).filter(
      (c) =>
        !needle ||
        `${c.name} ${c.address} ${c.coordinator} ${(c.areaKeywords ?? []).join(" ")}`.toLowerCase().includes(needle),
    );
    const withDistance = list.map((c) => ({
      c,
      km: me && Number.isFinite(c.lat) && Number.isFinite(c.lng) ? haversineKm(me.lat, me.lng, c.lat, c.lng) : null,
    }));
    if (me) withDistance.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    return withDistance;
  }, [query.data, search, me]);

  return (
    <Screen onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <Stack.Screen options={{ title: "House Fellowship" }} />
      <Text color="textSecondary">
        Our house fellowship centres meet across Ikorodu. Find the one closest to you and join us.
      </Text>
      <View style={styles.tools}>
        <Button
          title={me ? "Sorted by distance" : "Find centres near me"}
          icon={LocateFixed}
          loading={locating}
          onPress={locate}
          fullWidth
        />
        <SearchField
          value={search}
          onChangeDebounced={setSearch}
          placeholder="Search by area, street or name"
          delay={150}
        />
      </View>

      {query.isError && !query.data ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data ? (
        <ListSkeleton />
      ) : centers.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No centres match"
          message="Try another area, or ask us on WhatsApp."
          actionLabel="Ask on WhatsApp"
          onAction={() => Linking.openURL(CHURCH.fellowshipWhatsapp)}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {centers.map(({ c, km }) => (
            <CenterCard key={c.id} center={c} km={km} />
          ))}
        </View>
      )}
      <Text variant="small" color="textMuted" style={{ marginTop: spacing.lg }}>
        Can't find one near you? Message the fellowship coordinator on WhatsApp.
      </Text>
      <Button
        title="Message the coordinator"
        variant="ghost"
        icon={MessageCircle}
        onPress={() => Linking.openURL(CHURCH.fellowshipWhatsapp)}
      />
    </Screen>
  );
}

function CenterCard({ center: c, km }: { center: FellowshipCenter; km: number | null }) {
  const { colors } = useTheme();
  const row = (Icon: typeof MapPin, text: string) =>
    text ? (
      <View style={styles.row}>
        <Icon size={15} color={colors.textMuted} />
        <Text variant="small" color="textSecondary" style={{ flex: 1 }}>
          {text}
        </Text>
      </View>
    ) : null;
  const directions =
    c.mapLink || (Number.isFinite(c.lat) ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}` : "");

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {c.name}
        </Text>
        {km != null ? (
          <Text variant="label" color="primary">
            {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: 4, marginTop: spacing.xs }}>
        {row(MapPin, c.address)}
        {row(User, c.coordinator)}
        {row(Clock, c.meetingTime)}
      </View>
      <View style={styles.actions}>
        {directions ? (
          <Button title="Directions" size="sm" icon={Navigation} onPress={() => Linking.openURL(directions)} />
        ) : null}
        {c.whatsappLink ? (
          <Button
            title="WhatsApp"
            size="sm"
            variant="secondary"
            icon={MessageCircle}
            onPress={() => Linking.openURL(c.whatsappLink)}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tools: { gap: spacing.sm, marginVertical: spacing.md },
  row: { flexDirection: "row", gap: spacing.xs, alignItems: "flex-start" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
});
