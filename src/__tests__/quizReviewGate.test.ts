import { describe, expect, it } from "vitest";
import {
  hasClickableResource,
  mustReviewBeforeContinuing,
} from "@/lib/quizReviewGate";

const withLink = [{ listen_url: "/sermons/audio/1" }];
const noLinks = [{}, { listen_url: undefined, read_url: undefined }];

describe("quiz review gate", () => {
  it("locks after a wrong answer until a recommended message is opened", () => {
    expect(
      mustReviewBeforeContinuing({
        answeredWrong: true,
        reviewed: false,
        recommendations: withLink,
      }),
    ).toBe(true);
    expect(
      mustReviewBeforeContinuing({
        answeredWrong: true,
        reviewed: true,
        recommendations: withLink,
      }),
    ).toBe(false);
  });

  it("never locks a right answer", () => {
    expect(
      mustReviewBeforeContinuing({
        answeredWrong: false,
        reviewed: false,
        recommendations: withLink,
      }),
    ).toBe(false);
  });

  it("doesn't lock when there is nothing to open, but does while loading", () => {
    expect(hasClickableResource(noLinks)).toBe(false);
    expect(
      mustReviewBeforeContinuing({
        answeredWrong: true,
        reviewed: false,
        recommendations: [],
      }),
    ).toBe(false);
    expect(
      mustReviewBeforeContinuing({
        answeredWrong: true,
        reviewed: false,
        recommendations: [],
        loading: true,
      }),
    ).toBe(true);
  });
});
