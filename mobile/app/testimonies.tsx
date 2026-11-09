import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Heart, PenLine, Quote } from "~/components/icons";
import { testimoniesApi, type TestimonyInput } from "~/api/community";
import { FormField } from "~/components/FormField";
import { Button, Card, Chip, EmptyState, ListSkeleton, Screen, SegmentedControl, Sheet, Text } from "~/components";
import { formatShortDate } from "~/lib/dates";
import { spacing, useTheme } from "~/theme";

type Errors = Partial<Record<keyof TestimonyInput, string>>;

/** Same limits as the API schema and firestore.rules isValidTestimony. */
function validate(v: TestimonyInput): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (v.location.trim().length < 2) e.location = "Please enter your location.";
  if (v.phone.replace(/\D/g, "").length < 7) e.phone = "Please enter a valid phone number.";
  if (!/.+@.+\..+/.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.testimony.trim().length < 20) e.testimony = "Please share at least 20 characters.";
  if (v.testimony.length > 5000) e.testimony = "Please keep it under 5000 characters.";
  return e;
}

const EMPTY: TestimonyInput = { name: "", location: "", phone: "", email: "", testimony: "", displayPreference: "public" };

export default function TestimoniesScreen() {
  const [tab, setTab] = useState<"read" | "share">("read");
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Testimonies" }} />
      <View style={{ padding: spacing.gutter, paddingBottom: 0 }}>
        <SegmentedControl
          segments={[
            { value: "read", label: "Read" },
            { value: "share", label: "Share yours" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {tab === "read" ? <TestimonyFeed onShare={() => setTab("share")} /> : <ShareForm onDone={() => setTab("read")} />}
    </View>
  );
}

function TestimonyFeed({ onShare }: { onShare: () => void }) {
  const { colors } = useTheme();
  const q = useQuery({ queryKey: ["testimonies"], queryFn: testimoniesApi.verified, staleTime: 10 * 60 * 1000 });
  const [open, setOpen] = useState<{ name: string; testimony: string } | null>(null);

  return (
    <Screen onRefresh={() => void q.refetch()} refreshing={q.isRefetching}>
      {q.isLoading ? (
        <ListSkeleton rows={4} />
      ) : !q.data?.length ? (
        <EmptyState icon={Heart} title="No testimonies yet" message="Be the first to share what God has done." actionLabel="Share a testimony" onAction={onShare} />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {q.data.map((t) => (
            <Card key={t.id} onPress={() => setOpen(t)} accessibilityLabel={`Testimony from ${t.name}`}>
              <Quote size={20} color={colors.primary} />
              <Text numberOfLines={5} style={{ marginTop: spacing.xs }}>
                {t.testimony}
              </Text>
              <Text variant="label" style={{ marginTop: spacing.sm }}>
                {t.name}
              </Text>
              <Text variant="small" color="textMuted">
                {[t.location, formatShortDate(new Date(t.createdAt).toISOString())].filter(Boolean).join(" · ")}
              </Text>
            </Card>
          ))}
        </View>
      )}
      <Sheet visible={!!open} onClose={() => setOpen(null)} title={open ? `${open.name}'s testimony` : ""}>
        <Text variant="reader" style={{ fontSize: 17, lineHeight: 28 }}>
          {open?.testimony}
        </Text>
      </Sheet>
    </Screen>
  );
}

function ShareForm({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState<TestimonyInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof TestimonyInput) => (text: string) => setV((s) => ({ ...s, [k]: text }));

  const m = useMutation({
    mutationFn: testimoniesApi.submit,
    onSuccess: () => {
      setSent(true);
      setV(EMPTY);
    },
    onError: (e) => Alert.alert("Couldn't send your testimony", e instanceof Error ? e.message : "Please try again."),
  });

  const submit = () => {
    const e = validate(v);
    setErrors(e);
    if (Object.keys(e).length === 0) m.mutate({ ...v, name: v.name.trim(), email: v.email.trim() });
  };

  if (sent) {
    return (
      <Screen>
        <EmptyState
          icon={CheckCircle2}
          title="Thank you for sharing!"
          message="Your testimony has been received. It will appear here once it has been reviewed."
          actionLabel="Back to testimonies"
          onAction={() => {
            setSent(false);
            onDone();
          }}
        />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Screen>
        <View style={styles.form}>
          <FormField label="Full name" value={v.name} onChangeText={set("name")} error={errors.name} autoComplete="name" maxLength={100} />
          <FormField label="Location" value={v.location} onChangeText={set("location")} error={errors.location} placeholder="e.g. Ikorodu, Lagos" maxLength={100} />
          <FormField label="Phone number" value={v.phone} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" placeholder="+234…" maxLength={30} />
          <FormField label="Email" value={v.email} onChangeText={set("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} />
          <FormField
            label="Your testimony"
            value={v.testimony}
            onChangeText={set("testimony")}
            error={errors.testimony}
            multiline
            maxLength={5000}
            hint={`${v.testimony.length}/5000`}
          />
          <Text variant="label" color="textSecondary">
            May we share it publicly?
          </Text>
          <View style={styles.chips}>
            <Chip label="Yes, share publicly" selected={v.displayPreference === "public"} onPress={() => setV((s) => ({ ...s, displayPreference: "public" }))} />
            <Chip label="Keep it private" selected={v.displayPreference === "private"} onPress={() => setV((s) => ({ ...s, displayPreference: "private" }))} />
          </View>
          <Button title="Submit testimony" icon={PenLine} size="lg" fullWidth loading={m.isPending} onPress={submit} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  chips: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
});
