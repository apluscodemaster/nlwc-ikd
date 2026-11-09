export interface Track {
  /** Media id; for sermons this is the numeric sermon id (same key the website
   *  uses for saved progress). */
  id: number | string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  /** Playable audio URL. */
  url: string;
  /** Live streams have no duration, no seeking and no saved progress. */
  isLive?: boolean;
  /** Route to open from the full player ("View message"). */
  href?: string;
}

export interface PlayerStatus {
  playing: boolean;
  buffering: boolean;
  /** Seconds */
  position: number;
  /** Seconds; 0 when unknown */
  duration: number;
  rate: number;
}

export const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;
