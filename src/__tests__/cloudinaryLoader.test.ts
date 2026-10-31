import { describe, it, expect } from "vitest";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinaryLoader";

const BASE = "https://res.cloudinary.com/dj7rh8h6r/image/upload/";

describe("cloudinaryLoader", () => {
  it("adds a resize step to a URL with no transformations", () => {
    expect(
      cloudinaryLoader({ src: `${BASE}v1774/nlwc/hero.jpg`, width: 640 }),
    ).toBe(`${BASE}c_limit,w_640,q_auto,f_auto/v1774/nlwc/hero.jpg`);
  });

  it("keeps existing transformations and resizes after them", () => {
    expect(
      cloudinaryLoader({
        src: `${BASE}c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1774/nlwc/hero.jpg`,
        width: 828,
        quality: 75,
      }),
    ).toBe(
      `${BASE}c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/c_limit,w_828,q_75,f_auto/v1774/nlwc/hero.jpg`,
    );
  });

  it("handles chained transformations and no version segment", () => {
    expect(
      cloudinaryLoader({
        src: `${BASE}e_upscale/c_scale,w_1200/share-images/wp-abc`,
        width: 384,
      }),
    ).toBe(
      `${BASE}e_upscale/c_scale,w_1200/c_limit,w_384,q_auto,f_auto/share-images/wp-abc`,
    );
  });

  it("only claims Cloudinary image URLs", () => {
    expect(isCloudinaryUrl(`${BASE}v1/x.jpg`)).toBe(true);
    expect(
      isCloudinaryUrl("https://ikdadmin.nlwc.church/wp-content/x.jpg"),
    ).toBe(false);
    expect(isCloudinaryUrl("/logo.png")).toBe(false);
  });
});
