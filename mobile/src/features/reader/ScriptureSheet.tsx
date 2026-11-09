import { ActivityIndicator, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ExternalLink } from "~/components/icons";
import { Button, Sheet, Text } from "~/components";
import { useScripture } from "~/hooks/useReader";
import { getBibleGatewayUrl } from "~/shared";
import { spacing, useTheme } from "~/theme";

/** KJV text for a tapped reference (replaces the web's ScriptureTooltip). */
export function ScriptureSheet({ reference, onClose }: { reference: string | null; onClose: () => void }) {
  const { colors } = useTheme();
  const { data, isLoading, isError } = useScripture(reference);

  return (
    <Sheet visible={!!reference} onClose={onClose} title={data?.reference ?? reference ?? ""} maxHeight="70%">
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
      ) : isError || !data ? (
        <Text color="textSecondary">We couldn't load this passage right now.</Text>
      ) : (
        <View style={{ gap: spacing.xs }}>
          {data.verses?.length ? (
            data.verses.map((v) => (
              <Text key={`${v.chapter}:${v.verse}`} variant="reader" style={{ fontSize: 17, lineHeight: 27 }}>
                <Text variant="caption" color="primary">
                  {v.verse}{" "}
                </Text>
                {v.text.trim()}
              </Text>
            ))
          ) : (
            <Text variant="reader">{data.text}</Text>
          )}
          <Text variant="small" color="textMuted">
            {data.translation || "KJV"}
          </Text>
        </View>
      )}
      {reference ? (
        <Button
          title="Open in Bible Gateway"
          variant="ghost"
          icon={ExternalLink}
          style={{ marginTop: spacing.md }}
          onPress={() => WebBrowser.openBrowserAsync(getBibleGatewayUrl(reference)).catch(() => {})}
        />
      ) : null}
    </Sheet>
  );
}
