import { describe, it, expect } from "vitest";
import {
  extractCoordinates,
  isGoogleMapsUrl,
  haversineKm,
} from "@/utils/mapCoordinates";

// What the real share links for two centers resolve to (Oct 2026).
const OWODE =
  "https://www.google.com/maps/place/11+Offa+Cr,+ERUNKAN,+Lagos+105102,+Lagos/@6.6172536,3.4002654,16.38z/data=!4m6!3m5!1s0x103b92d3ebb894cf:0xd67b1f99d32dd9fa!8m2!3d6.6029596!4d3.4155425!16s%2Fg%2F11dznnhy7y?entry=tts";
const CHURCH =
  "https://www.google.com/maps/place/(NLWC)+New+and+Living+Way+Church,+Ikorodu/@6.6205318,3.5171722,17z/data=!3m1!4b1!4m6!3m5!1s0x103bee92e46e88f3:0x91120ab439eb6fa!8m2!3d6.6205318!4d3.5171722!16s%2Fg%2F11c2p0w3bm?entry=tts";

describe("extractCoordinates", () => {
  it("uses the place pin, not the map view centre", () => {
    // The view (@6.6172536,3.4002654) is ~2.3 km from the actual place.
    expect(extractCoordinates(OWODE)).toEqual({
      lat: 6.6029596,
      lng: 3.4155425,
    });
  });

  it("reads the church's pin", () => {
    expect(extractCoordinates(CHURCH)).toEqual({
      lat: 6.6205318,
      lng: 3.5171722,
    });
  });

  it("reads ?q=lat,lng links", () => {
    expect(
      extractCoordinates("https://maps.google.com/?q=6.6201,3.5084"),
    ).toEqual({ lat: 6.6201, lng: 3.5084 });
  });

  it("falls back to the view centre when there is no pin", () => {
    expect(
      extractCoordinates("https://www.google.com/maps/@6.6,3.4,15z"),
    ).toEqual({ lat: 6.6, lng: 3.4 });
  });

  it("unwraps Google's consent interstitial", () => {
    const consent = `https://consent.google.com/ml?continue=${encodeURIComponent(CHURCH)}&gl=DE`;
    expect(extractCoordinates(consent)).toEqual({
      lat: 6.6205318,
      lng: 3.5171722,
    });
  });

  it("finds coordinates in page markup", () => {
    const html = `<meta content="https://maps.google.com/maps/api/staticmap?center=6.6029596%2C3.4155425&amp;zoom=15">`;
    expect(extractCoordinates(html)).toEqual({ lat: 6.6029596, lng: 3.4155425 });
  });

  it("returns null when there are no coordinates", () => {
    expect(extractCoordinates("https://maps.app.goo.gl/uP4RjsUMCQcjyaMLA")).toBeNull();
  });
});

describe("isGoogleMapsUrl", () => {
  it.each([
    "https://maps.app.goo.gl/uP4RjsUMCQcjyaMLA",
    "https://goo.gl/maps/abc",
    "https://www.google.com/maps/place/x",
    "https://www.google.com.ng/maps/place/x",
    "https://maps.google.com/?q=1,2",
  ])("accepts %s", (url) => expect(isGoogleMapsUrl(url)).toBe(true));

  it.each([
    "https://example.com/maps",
    "https://www.google.com/search?q=maps",
    "https://goo.gl/xyz",
    "file:///etc/passwd",
    "not a url",
  ])("rejects %s", (url) => expect(isGoogleMapsUrl(url)).toBe(false));
});

describe("haversineKm", () => {
  it("measures the Owode pin error the fix corrects (~13.6 km)", () => {
    expect(haversineKm(6.6029596, 3.4155425, 6.6583, 3.525)).toBeCloseTo(13.6, 1);
  });
});
