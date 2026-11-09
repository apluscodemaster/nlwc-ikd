import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import { ChevronDown } from "lucide-react-native";
import { Card, Screen, SectionHeader, Text } from "~/components";
import { BELIEFS, STAND_FOR, STORY } from "~/data/about";
import { ScriptureSheet } from "~/features/reader/ScriptureSheet";
import { team } from "~/shared";
import { radius, spacing, useTheme } from "~/theme";

/** About (web /about): story, vision, mission, leadership, beliefs. */
export default function AboutScreen() {
  const { colors } = useTheme();
  const [open, setOpen] = useState<number | null>(0);
  const [ref, setRef] = useState<string | null>(null);

  return (
    <Screen>
      <Stack.Screen options={{ title: "About Us" }} />
      <Image source={{ uri: STORY.image }} style={styles.hero} contentFit="cover" accessibilityLabel="Church community" />
      <Text variant="caption" color="primary" style={{ marginTop: spacing.lg }}>
        Who we are
      </Text>
      <Text variant="title">A New Testament Church, Built on Truth</Text>
      <Text color="textSecondary" style={{ marginTop: spacing.xs }}>
        {STORY.intro}
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text variant="heading">Our Vision</Text>
        <Text color="textSecondary" style={{ marginTop: spacing.xxs }}>
          {STORY.vision}
        </Text>
        <Text variant="heading" style={{ marginTop: spacing.md }}>
          Our Mission
        </Text>
        <Text color="textSecondary">This shall be realized through:</Text>
        {STORY.mission.map((m) => (
          <Text key={m.title} style={{ marginTop: spacing.xxs }}>
            <Text variant="bodyStrong">{m.title}</Text> – {m.text}
          </Text>
        ))}
      </Card>

      <SectionHeader label="Our identity" title="What we stand for" />
      <View style={{ gap: spacing.sm }}>
        {STAND_FOR.map((s) => (
          <Card key={s.title}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
                <s.icon size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{s.title}</Text>
                <Text variant="small" color="textSecondary">
                  {s.description}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader label="Leadership" title="Our pastors" />
      <View style={{ gap: spacing.md }}>
        {team.map((m) => (
          <Card key={m.id} padded={false}>
            <Image source={{ uri: m.image }} style={styles.portrait} contentFit="cover" contentPosition="top" accessibilityLabel={m.name} />
            <View style={{ padding: spacing.md, gap: spacing.xxs }}>
              <Text variant="heading">{m.name}</Text>
              <Text variant="label" color="primary">
                {m.role}
              </Text>
              {m.bio.map((p, i) => (
                <Text key={i} color="textSecondary">
                  {p}
                </Text>
              ))}
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader label="Pillars of faith" title="Our foundation & beliefs" />
      <Card padded={false}>
        {BELIEFS.map((b, i) => {
          const isOpen = open === i;
          return (
            <View key={b.title} style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpen(isOpen ? null : i)}
                style={styles.acc}
              >
                <Text variant="bodyStrong" color={isOpen ? "primary" : "text"} style={{ flex: 1 }}>
                  {b.title}
                </Text>
                <ChevronDown size={18} color={colors.textMuted} style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }} />
              </Pressable>
              {isOpen ? (
                <View style={styles.accBody}>
                  <Text color="textSecondary">{b.content}</Text>
                  <View style={styles.refs}>
                    {b.scripture.split(";").map((r) => (
                      <Pressable key={r} onPress={() => setRef(r.trim().replace(/–/g, "-"))} accessibilityRole="link" hitSlop={6}>
                        <Text variant="label" color="primary">
                          {r.trim()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>
      <ScriptureSheet reference={ref} onClose={() => setRef(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.xl },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  portrait: { width: "100%", aspectRatio: 1 },
  acc: { flexDirection: "row", alignItems: "center", padding: spacing.md, minHeight: 52 },
  accBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.xs },
  refs: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.sm, rowGap: 4 },
});
