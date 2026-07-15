import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import SermonCard from "@/components/media/SermonCard";
import type { AudioSermon } from "@/lib/audioSermons";
import type { TranscriptStub } from "@/utils/transcriptSlug";

// Mock framer-motion to render plain divs
vi.mock("framer-motion", () => {
  const MotionDiv = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLDivElement>,
      ref: React.Ref<HTMLDivElement>,
    ) => {
      const { children, ...rest } = props;
      // Strip motion-specific props
      const htmlProps = Object.fromEntries(
        Object.entries(rest).filter(
          ([key]) =>
            !["initial", "animate", "exit", "transition", "whileHover", "whileTap", "layout", "variants"].includes(key),
        ),
      );
      return <div ref={ref} {...htmlProps}>{children}</div>;
    },
  );
  MotionDiv.displayName = "MotionDiv";

  const MockAnimatePresence = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  MockAnimatePresence.displayName = "AnimatePresence";

  return {
    motion: { div: MotionDiv },
    AnimatePresence: MockAnimatePresence,
  };
});

const baseSemon: AudioSermon = {
  id: 1,
  title: "The Grace of God",
  speaker: "Pastor John",
  date: "2025-01-15",
  listenUrl: "https://example.com/listen/1",
  downloadUrl: "https://example.com/download/1.mp3",
  thumbnailUrl: "https://example.com/thumb.jpg",
  series: "Grace Series",
  duration: "45:30",
};

const transcripts: TranscriptStub[] = [
  {
    slug: "the-grace-of-god",
    title: "The Grace of God",
    id: 100,
    categories: [20],
    baseSlug: "the-grace-of-god",
  },
];

describe("SermonCard", () => {
  const defaultProps = {
    sermon: baseSemon,
    index: 0,
    isActive: false,
    isPlaying: false,
    isLoadingDetail: false,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    transcriptSlugs: transcripts,
    onTranscriptClick: vi.fn(),
  };

  it("renders sermon title", () => {
    render(<SermonCard {...defaultProps} />);
    expect(screen.getByText("The Grace of God")).toBeInTheDocument();
  });

  it("renders speaker name", () => {
    render(<SermonCard {...defaultProps} />);
    expect(screen.getByText("Pastor John")).toBeInTheDocument();
  });

  it("renders date", () => {
    render(<SermonCard {...defaultProps} />);
    expect(screen.getByText("2025-01-15")).toBeInTheDocument();
  });

  it("renders series tag", () => {
    render(<SermonCard {...defaultProps} />);
    expect(screen.getByText("Grace Series")).toBeInTheDocument();
  });

  it("renders duration badge", () => {
    render(<SermonCard {...defaultProps} />);
    expect(screen.getByText("45:30")).toBeInTheDocument();
  });

  it("renders 'Listen' button when not playing", () => {
    render(<SermonCard {...defaultProps} />);
    expect(screen.getByText("Listen")).toBeInTheDocument();
  });

  it("renders 'Pause' button when playing", () => {
    render(<SermonCard {...defaultProps} isPlaying isActive />);
    // Multiple pause buttons (thumbnail + actions row)
    const pauseButtons = screen.getAllByText("Pause");
    expect(pauseButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onPlay when Listen is clicked", () => {
    const onPlay = vi.fn();
    render(<SermonCard {...defaultProps} onPlay={onPlay} />);
    const listenBtn = screen.getByText("Listen");
    fireEvent.click(listenBtn);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("calls onPause when Pause is clicked", () => {
    const onPause = vi.fn();
    render(
      <SermonCard {...defaultProps} isPlaying isActive onPause={onPause} />,
    );
    const pauseButtons = screen.getAllByText("Pause");
    fireEvent.click(pauseButtons[pauseButtons.length - 1]);
    expect(onPause).toHaveBeenCalled();
  });

  it("shows 'Now Playing' indicator when playing", () => {
    render(<SermonCard {...defaultProps} isPlaying isActive />);
    expect(screen.getByText("Now Playing")).toBeInTheDocument();
  });

  it("does not show 'Now Playing' when not playing", () => {
    render(<SermonCard {...defaultProps} />);
    expect(screen.queryByText("Now Playing")).not.toBeInTheDocument();
  });

  it("renders transcript button when transcript slug matches", () => {
    render(<SermonCard {...defaultProps} />);
    // Should show "Transcript" button (not "Transcripts" link)
    expect(screen.getByText("Transcript")).toBeInTheDocument();
  });

  it("calls onTranscriptClick when transcript button is clicked", () => {
    const onTranscriptClick = vi.fn();
    render(
      <SermonCard {...defaultProps} onTranscriptClick={onTranscriptClick} />,
    );
    fireEvent.click(screen.getByText("Transcript"));
    expect(onTranscriptClick).toHaveBeenCalledWith(
      "the-grace-of-god",
      "The Grace of God",
      "Pastor John",
    );
  });

  it("renders 'Transcripts' link when no transcript match", () => {
    render(<SermonCard {...defaultProps} transcriptSlugs={[]} />);
    expect(screen.getByText("Transcripts")).toBeInTheDocument();
  });

  it("renders download link when downloadUrl exists", () => {
    render(<SermonCard {...defaultProps} />);
    const downloadLink = screen.getByLabelText("Download");
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute("href", baseSemon.downloadUrl);
  });

  it("does not render download link when no downloadUrl", () => {
    const sermonNoDownload = { ...baseSemon, downloadUrl: undefined };
    render(<SermonCard {...defaultProps} sermon={sermonNoDownload} />);
    expect(screen.queryByLabelText("Download")).not.toBeInTheDocument();
  });

  it("does not render series tag when no series", () => {
    const sermonNoSeries = { ...baseSemon, series: undefined };
    render(<SermonCard {...defaultProps} sermon={sermonNoSeries} />);
    expect(screen.queryByText("Grace Series")).not.toBeInTheDocument();
  });

  it("renders share link with correct href", () => {
    render(<SermonCard {...defaultProps} />);
    const shareLink = screen.getByLabelText("Share this message");
    expect(shareLink).toHaveAttribute("href", "/sermons/audio/1");
  });
});
