import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Send, Youtube } from "lucide-react-native";
import { FormField } from "~/components/FormField";
import { Button, Card, IconButton, ListRow, Screen, SectionHeader, Text } from "~/components";
import { CHURCH, whatsappLink } from "~/lib/config";
import { spacing } from "~/theme";

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`New and Living Way Church, ${CHURCH.address}`)}`;

/**
 * Contact (web /contact). The website's form posts to /api/contact, which
 * requires a Cloudflare Turnstile token the app can't produce yet
 * (docs/ARCHITECTURE.md §7.4), so messages go via WhatsApp or email, both of
 * which the website also offers.
 */
export default function ContactScreen() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const body = `Hello NLWC Ikorodu,${name.trim() ? ` my name is ${name.trim()}.` : ""}\n\n${message.trim()}`;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Contact Us" }} />
      <Card padded={false}>
        <ListRow icon={MapPin} title="Our location" subtitle={CHURCH.address} onPress={() => Linking.openURL(MAPS)} showChevron />
        <ListRow icon={Phone} title="Call us" subtitle={CHURCH.phoneDisplay} onPress={() => Linking.openURL(`tel:${CHURCH.phone}`)} showChevron />
        <ListRow icon={Mail} title="Email" subtitle={CHURCH.email} onPress={() => Linking.openURL(`mailto:${CHURCH.email}`)} showChevron />
        <ListRow icon={MessageCircle} title="WhatsApp" subtitle={CHURCH.phoneDisplay} onPress={() => Linking.openURL(CHURCH.whatsapp)} showChevron />
      </Card>

      <SectionHeader label="Send a message" />
      <View style={{ gap: spacing.md }}>
        <FormField label="Your name" value={name} onChangeText={setName} autoComplete="name" />
        <FormField label="Message" value={message} onChangeText={setMessage} multiline maxLength={2000} />
        <View style={styles.row}>
          <Button title="Send on WhatsApp" icon={Send} disabled={!message.trim()} onPress={() => Linking.openURL(whatsappLink(body))} />
          <Button
            title="Email"
            variant="secondary"
            icon={Mail}
            disabled={!message.trim()}
            onPress={() =>
              Linking.openURL(`mailto:${CHURCH.email}?subject=${encodeURIComponent("Message from the NLWC app")}&body=${encodeURIComponent(body)}`)
            }
          />
        </View>
      </View>

      <SectionHeader label="Follow us" />
      <View style={styles.row}>
        <IconButton icon={Facebook} accessibilityLabel="Facebook" color="primary" onPress={() => WebBrowser.openBrowserAsync(CHURCH.social.facebook)} />
        <IconButton icon={Instagram} accessibilityLabel="Instagram" color="primary" onPress={() => WebBrowser.openBrowserAsync(CHURCH.social.instagram)} />
        <IconButton icon={Youtube} accessibilityLabel="YouTube" color="primary" onPress={() => WebBrowser.openBrowserAsync(CHURCH.social.youtube)} />
      </View>
      <Text variant="small" color="textMuted">
        We usually reply within a day.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", alignItems: "center" } });
