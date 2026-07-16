import { describe, it, expect } from "vitest";

/**
 * Reproduces the scoping bug: querySelectorAll() only matches descendants, so a
 * ref placed ON the content element matches nothing. Asserts the fix (checking
 * root.matches() too) finds it in BOTH scoping styles.
 */
const SEL = ".prose, [data-scripture-content]";

function collectOld(root: Element): Element[] {
  return Array.from(root.querySelectorAll(SEL));
}

function collectNew(root: Element): Element[] {
  const out: Element[] = Array.from(root.querySelectorAll(SEL));
  if (root instanceof Element && root.matches(SEL)) out.unshift(root);
  return out;
}

describe("ScriptureProvider scoping", () => {
  it("ref on an ANCESTOR wrapper: both old and new find the content", () => {
    const wrapper = document.createElement("div");
    const content = document.createElement("div");
    content.setAttribute("data-scripture-content", "true");
    content.className = "prose";
    wrapper.appendChild(content);

    expect(collectOld(wrapper)).toHaveLength(1); // worked before
    expect(collectNew(wrapper)).toHaveLength(1); // still works
  });

  it("ref ON the content element: old finds NOTHING, new finds it", () => {
    const content = document.createElement("div");
    content.setAttribute("data-scripture-content", "true");
    content.className = "prose";

    expect(collectOld(content)).toHaveLength(0); // ← the regression
    expect(collectNew(content)).toHaveLength(1); // ← fixed
  });

  it("does not double-count when content is both root and descendant-free", () => {
    const content = document.createElement("div");
    content.className = "prose";
    const inner = document.createElement("p");
    inner.textContent = "John 3:16";
    content.appendChild(inner);

    expect(collectNew(content)).toHaveLength(1);
  });
});
