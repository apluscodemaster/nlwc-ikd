import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Chip, SearchField, Sheet, Text } from "~/components";
import { useSermonFilters } from "~/hooks/useSermons";
import { spacing } from "~/theme";

export interface SermonFilters {
  seriesId?: number;
  speakerId?: number;
  topicId?: number;
  year?: number;
}

type Kind = "series" | "speaker" | "topic" | "year";

const FIRST_YEAR = 2015;

interface Props {
  kind: Kind | null;
  value: SermonFilters;
  onChange: (v: SermonFilters) => void;
  onClose: () => void;
}

/** One sheet per filter type (series / speaker / topic / year), with search for long lists. */
export function SermonFilterSheet({ kind, value, onChange, onClose }: Props) {
  const { series, speakers, topics } = useSermonFilters();
  const [q, setQ] = useState("");

  const options = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const all: { id: number; label: string; count?: number }[] =
      kind === "series"
        ? series.map((s) => ({ id: s.id, label: s.title, count: s.messageCount }))
        : kind === "speaker"
          ? speakers.map((s) => ({ id: s.id, label: s.name, count: s.messageCount }))
          : kind === "topic"
            ? topics.map((t) => ({ id: t.id, label: t.name, count: t.messageCount }))
            : Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_, i) => ({
                id: thisYear - i,
                label: String(thisYear - i),
              }));
    const needle = q.toLowerCase();
    return needle ? all.filter((o) => o.label.toLowerCase().includes(needle)) : all;
  }, [kind, series, speakers, topics, q]);

  const key: keyof SermonFilters | null =
    kind === "series" ? "seriesId" : kind === "speaker" ? "speakerId" : kind === "topic" ? "topicId" : kind === "year" ? "year" : null;
  const selected = key ? value[key] : undefined;
  const title = kind === "series" ? "Series" : kind === "speaker" ? "Speaker" : kind === "topic" ? "Topic" : "Year";

  const pick = (id: number | undefined) => {
    if (!key) return;
    onChange({ ...value, [key]: id });
    setQ("");
    onClose();
  };

  return (
    <Sheet visible={kind != null} onClose={onClose} title={`Filter by ${title.toLowerCase()}`}>
      {kind !== "year" && options.length > 12 ? (
        <View style={styles.search}>
          <SearchField value={q} onChangeDebounced={setQ} placeholder={`Search ${title.toLowerCase()}`} delay={150} />
        </View>
      ) : null}
      <View style={styles.wrap}>
        <Chip label={`All`} selected={selected == null} onPress={() => pick(undefined)} />
        {options.map((o) => (
          <Chip
            key={o.id}
            label={o.count != null ? `${o.label} (${o.count})` : o.label}
            selected={selected === o.id}
            onPress={() => pick(o.id)}
          />
        ))}
      </View>
      {options.length === 0 ? (
        <Text color="textSecondary" style={{ marginTop: spacing.md }}>
          Nothing matches “{q}”.
        </Text>
      ) : null}
      {selected != null ? (
        <Button title="Clear filter" variant="ghost" onPress={() => pick(undefined)} style={{ marginTop: spacing.md }} />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
