import { ImageResponse } from "next/og";

// Branded default social-share card (1200×630), generated at request time.
// Applies site-wide to any route that doesn't set its own openGraph.images.
export const alt =
  "The New & Living Way Church, Ikorodu — Watch Live, Listen, and Grow";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "80px",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0b0f1a 0%, #1a1206 55%, #2a1606 100%)",
          color: "#ffffff",
        }}
      >
        {/* Brand eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 18,
              height: 58,
              background: "#FF7C18",
              borderRadius: 6,
            }}
          />
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#FFB37A",
            }}
          >
            NLWC Ikorodu
          </div>
        </div>

        {/* Headline + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            <span>The New &amp; Living Way&nbsp;</span>
            <span style={{ color: "#FF7C18" }}>Church</span>
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#d6d6d6", maxWidth: 940 }}>
            A community of faith, hope &amp; love in Ikorodu, Lagos — worship,
            sermons, daily devotionals &amp; live services online.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#9aa0aa",
          }}
        >
          <div style={{ display: "flex" }}>ikorodu.nlwc.church</div>
          <div style={{ display: "flex", color: "#FF7C18", fontWeight: 700 }}>
            Watch · Listen · Grow
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
