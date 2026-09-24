import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MarqueeText } from "@/components/media/MarqueeText";

/**
 * jsdom reports every layout measurement as 0, so overflow has to be faked.
 * `scrollWidth` is stubbed on the inner span and `clientWidth` on the
 * container — exactly the two the component compares.
 */
function mockWidths({ text, container }: { text: number; container: number }) {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      // The outer span is the only one carrying `title`; the inner one holds
      // the text whose natural width drives the overflow calculation.
      return this.hasAttribute("title") ? container : text;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return container;
    },
  });
}

function restoreWidths() {
  for (const prop of ["scrollWidth", "clientWidth"]) {
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get() {
        return 0;
      },
    });
  }
}

const LONG = "A Very Long Sermon Title That Cannot Possibly Fit On A Phone";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
  // Component observes its container; jsdom has no ResizeObserver.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  restoreWidths();
  vi.unstubAllGlobals();
});

describe("MarqueeText", () => {
  it("always renders the full text, so nothing is lost to the clip", () => {
    mockWidths({ text: 600, container: 200 });
    render(<MarqueeText text={LONG} />);
    expect(screen.getByText(LONG)).toBeInTheDocument();
  });

  it("animates when the text overflows and the player is active", () => {
    mockWidths({ text: 600, container: 200 });
    const { container } = render(<MarqueeText text={LONG} active />);
    const inner = container.querySelector("span > span")!;
    expect(inner.className).toContain("animate-marquee-sweep");
    // Shift equals the hidden distance, so the end of the title lands flush.
    expect(inner.getAttribute("style")).toContain("-400px");
  });

  it("holds still while the player is paused", () => {
    mockWidths({ text: 600, container: 200 });
    const { container } = render(<MarqueeText text={LONG} active={false} />);
    const inner = container.querySelector("span > span")!;
    expect(inner.className).not.toContain("animate-marquee-sweep");
    // Falls back to the ellipsis behaviour it replaces.
    expect(inner.className).toContain("text-ellipsis");
  });

  it("does not animate a title that already fits", () => {
    mockWidths({ text: 180, container: 200 });
    const { container } = render(<MarqueeText text="Short" active />);
    const inner = container.querySelector("span > span")!;
    expect(inner.className).not.toContain("animate-marquee-sweep");
  });

  it("ignores sub-threshold overflow from rounding", () => {
    mockWidths({ text: 203, container: 200 });
    const { container } = render(<MarqueeText text={LONG} active />);
    const inner = container.querySelector("span > span")!;
    expect(inner.className).not.toContain("animate-marquee-sweep");
  });

  it("stays still when the visitor prefers reduced motion", () => {
    (window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    mockWidths({ text: 600, container: 200 });
    const { container } = render(<MarqueeText text={LONG} active />);
    const inner = container.querySelector("span > span")!;
    expect(inner.className).not.toContain("animate-marquee-sweep");
  });

  it("exposes the full title as a tooltip", () => {
    mockWidths({ text: 600, container: 200 });
    const { container } = render(<MarqueeText text={LONG} active />);
    expect(container.querySelector("span")!.getAttribute("title")).toBe(LONG);
  });

  it("scales duration with distance so long titles do not race", () => {
    mockWidths({ text: 1000, container: 200 });
    const { container: far } = render(<MarqueeText text={LONG} active />);
    const farDuration = far
      .querySelector("span > span")!
      .getAttribute("style")!;

    restoreWidths();
    mockWidths({ text: 400, container: 200 });
    const { container: near } = render(<MarqueeText text={LONG} active />);
    const nearDuration = near
      .querySelector("span > span")!
      .getAttribute("style")!;

    const parse = (s: string) =>
      Number(/animation-duration:\s*([\d.]+)s/.exec(s)?.[1]);
    expect(parse(farDuration)).toBeGreaterThan(parse(nearDuration));
  });
});
