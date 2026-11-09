import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Headphones, Mail } from "lucide-react-native";
import { Button, Card, Screen, Text } from "~/components";
import { HtmlContent } from "~/features/reader/HtmlContent";
import { ScriptureSheet } from "~/features/reader/ScriptureSheet";
import { radius, spacing, useTheme } from "~/theme";

// Prayer text from the website's src/app/salvation/page.tsx. Rendered through
// the reader so scripture references are tappable, as on the web.
const SALVATION_PRAYER = `<p>Heavenly Father, I come to you in the name of Jesus. Your Word says, “Whosoever shall call upon the name of the Lord shall be saved” (Acts 2:21). I am calling on you.</p>
<p>I pray and ask Jesus to come into my heart and be Lord over my life according to Romans 10:9-10: “If thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved. For with the heart man believeth unto righteousness; and with the mouth, confession is made unto salvation.”</p>
<p>I do that now. I believe in my heart that God raised Him from the dead. I am now reborn! I am a Christian — a child of the Almighty God. I am saved!</p>`;

const HOLY_GHOST_PRAYER = `<p>You also said in your Word, “If ye then, being evil, know how to give good gifts unto your children: HOW MUCH MORE shall your heavenly Father give the Holy Spirit to them that ask him?” (Luke 11:13)</p>
<p>I'm also asking you to fill me with the Holy Spirit. Holy Spirit, rise up within me as I praise God. I fully expect to speak with other tongues as you give me utterance (Acts 2:4). In Jesus' name. Amen!</p>
<p><strong>Begin to praise God for filling you with the Holy Spirit!</strong></p>`;

const HERO = "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774640624/salvation_lb2tsf.jpg";

export default function SalvationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [ref, setRef] = useState<string | null>(null);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Salvation" }} />
      <Image source={{ uri: HERO }} style={styles.hero} contentFit="cover" />
      <Text variant="title" style={{ marginTop: spacing.lg }}>
        Become Born-Again Today
      </Text>
      <Text color="textSecondary" style={{ marginBottom: spacing.lg }}>
        God loves you and wants you to have a personal relationship with Him. The following prayer will guide you into that new life in Christ.
      </Text>

      <Card style={{ backgroundColor: colors.accentSoft }}>
        <Text variant="caption" color="primary" style={{ marginBottom: spacing.xs }}>
          Prayer of Salvation
        </Text>
        <HtmlContent html={SALVATION_PRAYER} fontSize={17} onScripture={setRef} inset={spacing.gutter * 2} />
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text variant="caption" color="primary" style={{ marginBottom: spacing.xs }}>
          Prayer for Baptism of the Holy Ghost
        </Text>
        <HtmlContent html={HOLY_GHOST_PRAYER} fontSize={17} onScripture={setRef} inset={spacing.gutter * 2} />
      </Card>

      <Text variant="heading" style={{ marginTop: spacing.xl }}>
        What's next?
      </Text>
      <Text color="textSecondary">
        Congratulations on making the most important decision of your life! We'd love to walk with you on this journey. Connect with us today.
      </Text>
      <View style={styles.actions}>
        <Button title="Contact us" icon={Mail} onPress={() => router.push("/contact")} />
        <Button title="Listen to messages" variant="secondary" icon={Headphones} onPress={() => router.push("/listen")} />
      </View>
      <ScriptureSheet reference={ref} onClose={() => setRef(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.xl },
  actions: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", marginTop: spacing.md },
});
