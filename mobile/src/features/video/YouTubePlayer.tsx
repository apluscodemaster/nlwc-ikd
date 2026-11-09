import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { WebView } from "react-native-webview";
import { Skeleton } from "~/components";
import { radius } from "~/theme";

interface Props {
  /** YouTube video id */
  videoId?: string | null;
  /** Fallback embed URL (e.g. a channel's live_stream embed) */
  embedUrl?: string | null;
  autoplay?: boolean;
  /** Horizontal padding of the parent, to size the 16:9 frame */
  inset?: number;
}

/** 16:9 YouTube player. Uses the iframe API for videos and a WebView for other embeds. */
export function YouTubePlayer({ videoId, embedUrl, autoplay, inset = 0 }: Props) {
  const { width } = useWindowDimensions();
  const w = width - inset * 2;
  const h = Math.round((w * 9) / 16);
  const [ready, setReady] = useState(false);

  return (
    <View style={[styles.frame, { width: w, height: h }]}>
      {!ready ? (
        <View style={StyleSheet.absoluteFill}>
          <Skeleton width={w} height={h} rounded={radius.lg} />
        </View>
      ) : null}
      {videoId ? (
        <YoutubePlayer
          height={h}
          width={w}
          videoId={videoId}
          play={autoplay}
          onReady={() => setReady(true)}
          webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false }}
        />
      ) : embedUrl ? (
        <WebView
          source={{ uri: embedUrl }}
          style={{ width: w, height: h, backgroundColor: "#000" }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          onLoadEnd={() => setReady(true)}
          // Keep navigation inside the embed; links open nothing else.
          setSupportMultipleWindows={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000", alignSelf: "center" },
});
