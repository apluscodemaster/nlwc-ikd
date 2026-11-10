import { memo, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import RenderHtml, { type MixedStyleRecord } from "react-native-render-html";
import * as WebBrowser from "expo-web-browser";
import { fonts, spacing, useTheme } from "~/theme";
import { prepareHtml, SCRIPTURE_SCHEME } from "./prepareHtml";

interface Props {
  html: string;
  fontSize: number;
  /** Search query to highlight (from the list the reader came from). */
  query?: string;
  onScripture?: (reference: string) => void;
  /** Horizontal padding of the parent, for image sizing. */
  inset?: number;
}

const SYSTEM_FONTS = [fonts.regular, fonts.medium, fonts.semibold, fonts.bold];
const IGNORED_TAGS = ["script", "style", "iframe", "form", "input", "button", "svg"];

/** Long-form WordPress HTML with reader typography (DESIGN.md §4.6). */
function HtmlContentBase({ html, fontSize, query, onScripture, inset = spacing.gutter }: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  const source = useMemo(() => ({ html: prepareHtml(html, { query }) }), [html, query]);
  const lineHeight = Math.round(fontSize * 1.65);

  const tagsStyles = useMemo<MixedStyleRecord>(
    () => ({
      body: { color: colors.text, fontFamily: fonts.regular, fontSize, lineHeight },
      p: { marginTop: 0, marginBottom: spacing.md },
      h1: { fontFamily: fonts.semibold, fontSize: fontSize + 6, lineHeight: lineHeight + 6, marginVertical: spacing.md },
      h2: { fontFamily: fonts.semibold, fontSize: fontSize + 4, lineHeight: lineHeight + 4, marginVertical: spacing.md },
      h3: { fontFamily: fonts.semibold, fontSize: fontSize + 2, marginVertical: spacing.sm },
      h4: { fontFamily: fonts.semibold, fontSize: fontSize + 1, marginVertical: spacing.sm },
      strong: { fontFamily: fonts.semibold },
      b: { fontFamily: fonts.semibold },
      em: { fontStyle: "italic" },
      a: { color: colors.primary, textDecorationLine: "none", fontFamily: fonts.medium },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        backgroundColor: colors.accentSoft,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginVertical: spacing.md,
        marginHorizontal: 0,
      },
      mark: { backgroundColor: "#FDE68A", color: "#111827" },
      li: { marginBottom: spacing.xs },
      ul: { marginBottom: spacing.md },
      ol: { marginBottom: spacing.md },
      img: { borderRadius: 10 },
      hr: { backgroundColor: colors.border, height: 1, marginVertical: spacing.lg },
    }),
    [colors, fontSize, lineHeight],
  );

  const classesStyles = useMemo<MixedStyleRecord>(
    () => ({
      memory: { borderLeftColor: colors.accent, paddingVertical: spacing.sm },
      "memory-title": {
        fontFamily: fonts.semibold,
        fontSize: 11,
        letterSpacing: 1,
        color: colors.accent,
        marginBottom: 4,
      },
    }),
    [colors],
  );

  return (
    <RenderHtml
      contentWidth={width - inset * 2}
      source={source}
      tagsStyles={tagsStyles}
      classesStyles={classesStyles}
      systemFonts={SYSTEM_FONTS}
      ignoredDomTags={IGNORED_TAGS}
      enableExperimentalMarginCollapsing
      defaultTextProps={{ selectable: true }}
      renderersProps={{
        a: {
          onPress: (_e, href) => {
            if (href.startsWith(SCRIPTURE_SCHEME)) {
              onScripture?.(decodeURIComponent(href.slice(SCRIPTURE_SCHEME.length)));
            } else if (/^https?:\/\//.test(href)) {
              WebBrowser.openBrowserAsync(href).catch(() => {});
            }
          },
        },
      }}
    />
  );
}

export const HtmlContent = memo(HtmlContentBase);
