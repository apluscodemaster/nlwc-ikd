import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoScrollTo } from "@/hooks/useAutoScrollTo";

function makeRef() {
  const el = document.createElement("div");
  el.scrollIntoView = vi.fn();
  return { current: el };
}

describe("useAutoScrollTo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/listen-live");
    // jsdom has no matchMedia; default to "no reduced-motion preference".
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("smooth-scrolls the target into view after the delay", () => {
    const ref = makeRef();
    renderHook(() => useAutoScrollTo(ref, { delay: 100 }));

    expect(ref.current.scrollIntoView).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(ref.current.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("jumps instead of gliding when the user prefers reduced motion", () => {
    (window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({
      matches: true,
    });
    const ref = makeRef();
    renderHook(() => useAutoScrollTo(ref, { delay: 0 }));
    vi.advanceTimersByTime(0);
    expect(ref.current.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("stays out of the way when the URL has a #hash", () => {
    window.history.replaceState(null, "", "/listen-live#elsewhere");
    const ref = makeRef();
    renderHook(() => useAutoScrollTo(ref, { delay: 0 }));
    vi.advanceTimersByTime(0);
    expect(ref.current.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const ref = makeRef();
    renderHook(() => useAutoScrollTo(ref, { delay: 0, enabled: false }));
    vi.advanceTimersByTime(0);
    expect(ref.current.scrollIntoView).not.toHaveBeenCalled();
  });

  it("cancels the pending scroll on unmount", () => {
    const ref = makeRef();
    const { unmount } = renderHook(() => useAutoScrollTo(ref, { delay: 100 }));
    unmount();
    vi.advanceTimersByTime(100);
    expect(ref.current.scrollIntoView).not.toHaveBeenCalled();
  });
});
