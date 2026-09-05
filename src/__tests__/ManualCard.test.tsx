import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ManualCard from "@/components/media/ManualCard";
import type { SundaySchoolManual } from "@/lib/wordpress";

// Mock framer-motion to render plain divs
vi.mock("framer-motion", () => {
  const MotionDiv = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLDivElement>,
      ref: React.Ref<HTMLDivElement>,
    ) => {
      const { children, ...rest } = props;
      const htmlProps = Object.fromEntries(
        Object.entries(rest).filter(
          ([key]) =>
            ![
              "initial",
              "animate",
              "exit",
              "transition",
              "whileHover",
              "whileTap",
              "layout",
              "variants",
            ].includes(key),
        ),
      );
      return (
        <div ref={ref} {...htmlProps}>
          {children}
        </div>
      );
    },
  );
  MotionDiv.displayName = "MotionDiv";

  return { motion: { div: MotionDiv } };
});

const publishedManual: SundaySchoolManual = {
  id: 1,
  title: "Faith for Healing",
  content: "",
  excerpt: "THEME: Jesus the Healer LESSON: One",
  date: "2026-06-21T12:00:00",
  formattedDate: "Jun 21, 2026",
  slug: "faith-for-healing",
  link: "https://ikorodu.nlwc.church/faith-for-healing/",
  readingTime: 7,
  theme: "Jesus the Healer",
  lesson: "One",
  status: "publish",
  isScheduled: false,
};

const scheduledManual: SundaySchoolManual = {
  ...publishedManual,
  id: 2,
  title: "Walking in Divine Health",
  slug: "walking-in-divine-health",
  date: "2026-12-20T09:00:00",
  formattedDate: "Dec 20, 2026",
  status: "future",
  isScheduled: true,
};

describe("ManualCard", () => {
  it("links a published manual to its detail page", () => {
    render(<ManualCard manual={publishedManual} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/manuals/faith-for-healing");
  });

  it("carries the search query through to the detail page", () => {
    render(<ManualCard manual={publishedManual} searchQuery="healing" />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/manuals/faith-for-healing?q=healing",
    );
  });

  it("renders no link at all for a scheduled manual", () => {
    render(<ManualCard manual={scheduledManual} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("marks a scheduled manual as disabled and shows its release date", () => {
    const { container } = render(<ManualCard manual={scheduledManual} />);
    expect(container.querySelector('[aria-disabled="true"]')).not.toBeNull();
    expect(screen.getByText("Available Dec 20, 2026")).toBeInTheDocument();
    expect(screen.getByText("Coming Dec 20, 2026")).toBeInTheDocument();
  });

  it("greys a scheduled manual out and blocks pointer interaction", () => {
    const { container } = render(<ManualCard manual={scheduledManual} />);
    const shell = container.querySelector('[aria-disabled="true"]');
    expect(shell?.className).toContain("grayscale");
    expect(shell?.className).toContain("cursor-not-allowed");
  });

  it("hides the share control on a scheduled manual", () => {
    render(<ManualCard manual={scheduledManual} />);
    expect(screen.queryByLabelText("Share this manual")).not.toBeInTheDocument();
  });

  it("keeps the share control on a published manual", () => {
    render(<ManualCard manual={publishedManual} />);
    expect(screen.getByLabelText("Share this manual")).toBeInTheDocument();
  });

  it("hides the read-time on a scheduled manual but keeps it when published", () => {
    const { unmount } = render(<ManualCard manual={publishedManual} />);
    expect(screen.getByText("7 min read")).toBeInTheDocument();
    unmount();

    render(<ManualCard manual={scheduledManual} />);
    expect(screen.queryByText("7 min read")).not.toBeInTheDocument();
  });

  it("still shows the title of a scheduled manual", () => {
    render(<ManualCard manual={scheduledManual} />);
    // The title appears twice: as the card heading and inside the generated
    // ManualThumbnail artwork.
    expect(
      screen.getByRole("heading", { name: "Walking in Divine Health" }),
    ).toBeInTheDocument();
  });
});
