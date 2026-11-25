import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import React, { useState } from "react";
import { useDialogA11y } from "@/hooks/useDialogA11y";

function Dialog({ modal = true, onClose }: { modal?: boolean; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const close = () => {
    onClose();
    setOpen(false);
  };
  const ref = useDialogA11y(open, close, { modal });
  return (
    <div>
      <button>outside</button>
      {open && (
        <div ref={ref} role="dialog">
          <button>first</button>
          <button data-autofocus>confirm</button>
          <button>last</button>
        </div>
      )}
    </div>
  );
}

const nextFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(null))));

describe("useDialogA11y", () => {
  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus to the data-autofocus element when a modal opens", async () => {
    const { getByText } = render(<Dialog onClose={() => {}} />);
    await nextFrame();
    expect(document.activeElement).toBe(getByText("confirm"));
  });

  it("keeps Tab inside a modal", async () => {
    const { getByText } = render(<Dialog onClose={() => {}} />);
    await nextFrame();
    getByText("last").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByText("first"));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByText("last"));
  });

  it("restores focus to where it was when the modal closes", async () => {
    const outsideFocus = document.createElement("button");
    document.body.appendChild(outsideFocus);
    outsideFocus.focus();
    render(<Dialog onClose={() => {}} />);
    await nextFrame();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(outsideFocus);
    outsideFocus.remove();
  });

  it("never takes focus for a non-modal pop-up", async () => {
    const { getByText } = render(<Dialog modal={false} onClose={() => {}} />);
    getByText("outside").focus();
    await nextFrame();
    expect(document.activeElement).toBe(getByText("outside"));
  });
});
