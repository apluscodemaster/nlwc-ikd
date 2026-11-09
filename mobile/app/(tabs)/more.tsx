import { Linking, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  BookHeart,
  Brain,
  Church,
  HandCoins,
  Heart,
  Images,
  Mail,
  MessageCircle,
  Newspaper,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "~/components/icons";
import { Card, ListRow, Screen, SectionHeader, Text } from "~/components";
import { APP_VERSION, CHURCH } from "~/lib/config";
import { spacing } from "~/theme";

type Item = { label: string; subtitle?: string; icon: LucideIcon } & ({ href: Href } | { url: string });

const SECTIONS: { label: string; items: Item[] }[] = [
  {
    label: "Grow",
    items: [
      { label: "Bible Quiz", subtitle: "Test your knowledge of the messages", icon: Brain, href: "/quiz" },
      { label: "Salvation", subtitle: "Become born again today", icon: BookHeart, href: "/salvation" },
    ],
  },
  {
    label: "Connect",
    items: [
      { label: "House Fellowship", subtitle: "Find a centre near you", icon: Users, href: "/fellowship" },
      { label: "Testimonies", subtitle: "Read and share what God has done", icon: Heart, href: "/testimonies" },
      { label: "Church Gallery", icon: Images, href: "/gallery" },
      { label: "First time here?", icon: Sparkles, href: "/welcome" },
      { label: "Blog", icon: Newspaper, url: CHURCH.blog },
    ],
  },
  {
    label: "Church",
    items: [
      { label: "About Us", icon: Church, href: "/about" },
      { label: "Give", subtitle: "Tithes, offerings and projects", icon: HandCoins, href: "/give" },
      { label: "Contact Us", icon: Mail, href: "/contact" },
      { label: "Chat on WhatsApp", icon: MessageCircle, url: CHURCH.whatsapp },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

/** More tab: everything that isn't a primary tab. */
export default function MoreTab() {
  const router = useRouter();
  return (
    <Screen>
      {SECTIONS.map((section) => (
        <View key={section.label}>
          <SectionHeader label={section.label} />
          <Card padded={false}>
            {section.items.map((item) => (
              <ListRow
                key={item.label}
                icon={item.icon}
                title={item.label}
                subtitle={item.subtitle}
                showChevron
                onPress={() =>
                  "href" in item
                    ? router.push(item.href)
                    : item.url.startsWith("https://wa.me")
                      ? Linking.openURL(item.url)
                      : WebBrowser.openBrowserAsync(item.url).catch(() => {})
                }
              />
            ))}
          </Card>
        </View>
      ))}
      <Text variant="small" color="textMuted" align="center" style={styles.version}>
        {CHURCH.name}
        {"\n"}Version {APP_VERSION}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ version: { marginTop: spacing.xxl } });
