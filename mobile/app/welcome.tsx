import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { CheckCircle2, Send } from "lucide-react-native";
import { FormField } from "~/components/FormField";
import { Button, Card, Chip, EmptyState, Screen, Text } from "~/components";
import { whatsappLink } from "~/lib/config";
import { spacing } from "~/theme";

type YesNo = "Yes" | "No" | "";

/**
 * First-time guest card (web /welcome). Like the website, the details are
 * sent to the welcome team as a pre-filled WhatsApp message.
 */
export default function WelcomeScreen() {
  const [f, setF] = useState({ fullName: "", phone: "", email: "", address: "", invitedBy: "" });
  const [bornAgain, setBornAgain] = useState<YesNo>("");
  const [holyGhost, setHolyGhost] = useState<YesNo>("");
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const complete = Object.values(f).every((v) => v.trim()) && bornAgain && holyGhost;

  const submit = () => {
    const message = `Hello NLWC Ikorodu Welcome Team, I am a first-time guest!\n\n*Name:* ${f.fullName}\n*Phone:* ${f.phone}\n*Email:* ${f.email}\n*Address:* ${f.address}\n*Born Again:* ${bornAgain}\n*Holy Ghost Baptized (Speaking in tongues):* ${holyGhost}\n*Invited By:* ${f.invitedBy}\n\n*Sent from:* NLWC Ikorodu app`;
    Linking.openURL(whatsappLink(message)).catch(() => {});
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Welcome" }} />
        <EmptyState
          icon={CheckCircle2}
          title="Welcome home!"
          message="Thank you for sharing your details with us. Someone from our welcome team will reach out to you shortly."
        />
      </Screen>
    );
  }

  const yesNo = (value: YesNo, onChange: (v: YesNo) => void) => (
    <View style={styles.chips}>
      <Chip label="Yes" selected={value === "Yes"} onPress={() => onChange("Yes")} />
      <Chip label="No" selected={value === "No"} onPress={() => onChange("No")} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Screen>
        <Stack.Screen options={{ title: "First time here?" }} />
        <Text variant="caption" color="primary">
          You are welcome
        </Text>
        <Text variant="title">We are honored to have you join us.</Text>
        <Text color="textSecondary" style={{ marginTop: spacing.xs }}>
          At New and Living Way Church, we believe there are no accidents in the kingdom of God. Your presence today is a blessing to us, and we want to ensure you feel right at home.
        </Text>
        <Card style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <FormField label="Full name" value={f.fullName} onChangeText={set("fullName")} autoComplete="name" />
          <FormField label="Phone number" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" />
          <FormField label="Email address" value={f.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
          <FormField label="Residential address" value={f.address} onChangeText={set("address")} placeholder="Where are you joining us from?" multiline style={{ minHeight: 80 }} />
          <Text variant="label" color="textSecondary">
            Born again?
          </Text>
          {yesNo(bornAgain, setBornAgain)}
          <Text variant="label" color="textSecondary">
            Holy Ghost baptized? (with the evidence of speaking in tongues)
          </Text>
          {yesNo(holyGhost, setHolyGhost)}
          <FormField label="Who invited you to church?" value={f.invitedBy} onChangeText={set("invitedBy")} placeholder="Name of inviter, or 'Social Media', etc." />
          <Button title="Send my details" icon={Send} size="lg" fullWidth disabled={!complete} onPress={submit} />
          <Text variant="small" color="textMuted">
            Opens WhatsApp with your details ready to send to our welcome team.
          </Text>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ chips: { flexDirection: "row", gap: spacing.xs } });
