/**
 * Quiz celebration milestones.
 *
 * Decides WHEN a ribbon celebration should fire and remembers what has already
 * been celebrated, so each achievement is celebrated exactly once — not on every
 * re-render or page revisit. Persisted in localStorage alongside the existing
 * mastery state.
 */

const KEY = "nlwc_quiz_celebrations";

/** Streak lengths (days) worth celebrating. */
const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30, 50, 75, 100];
/** Mastery-percent thresholds worth celebrating. */
const MASTERY_MILESTONES = [25, 50, 75, 100];

interface CelebrationState {
  /** Highest streak milestone already celebrated. */
  streakMilestone: number;
  /** Highest mastery milestone already celebrated. */
  masteryMilestone: number;
  /** Whether the player was #1 at the last check. */
  wasTop: boolean;
  /** The score they last celebrated being #1 with. */
  topScore: number;
}

const DEFAULT: CelebrationState = {
  streakMilestone: 0,
  masteryMilestone: 0,
  wasTop: false,
  topScore: 0,
};

function load(): CelebrationState {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

function save(state: CelebrationState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — non-critical */
  }
}

/** The highest milestone in `list` that `value` has reached. */
function highestReached(value: number, list: number[]): number {
  let hit = 0;
  for (const m of list) if (value >= m) hit = m;
  return hit;
}

export interface MilestoneHit {
  kind: "streak" | "mastery";
  value: number; // the milestone reached (e.g. 7 days, 50 percent)
}

/**
 * Check whether a streak/mastery milestone was newly reached, recording it so it
 * won't fire again. Returns the highest newly-crossed milestone, or null.
 */
export function checkMilestones(
  streak: number,
  masteryPercent: number,
): MilestoneHit | null {
  const state = load();
  let hit: MilestoneHit | null = null;

  const streakReached = highestReached(streak, STREAK_MILESTONES);
  if (streakReached > state.streakMilestone) {
    state.streakMilestone = streakReached;
    hit = { kind: "streak", value: streakReached };
  }

  const masteryReached = highestReached(masteryPercent, MASTERY_MILESTONES);
  if (masteryReached > state.masteryMilestone) {
    state.masteryMilestone = masteryReached;
    // Mastery (rarer, tops out at 100%) takes visual precedence if both land.
    hit = { kind: "mastery", value: masteryReached };
  }

  if (hit) save(state);
  return hit;
}

/**
 * Check whether the player has newly claimed the #1 leaderboard spot — either
 * they weren't #1 before, or they've reclaimed it with a higher score. Records
 * the result so holding #1 across visits doesn't re-fire.
 */
export function checkTopScore(isTop: boolean, myScore: number): boolean {
  const state = load();

  if (!isTop) {
    if (state.wasTop) {
      state.wasTop = false;
      save(state);
    }
    return false;
  }

  const newlyTop = !state.wasTop || myScore > state.topScore;
  if (newlyTop) {
    state.wasTop = true;
    state.topScore = myScore;
    save(state);
  }
  return newlyTop;
}
