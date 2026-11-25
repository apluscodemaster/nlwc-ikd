/**
 * Festival of Jesus' Reign: the facts on the event banner, in one place for
 * the page, its metadata, the structured data and the calendar file.
 */
export const FESTIVAL = {
  name: "Festival of Jesus' Reign",
  tagline: "Join us as the City of Ikorodu celebrates",
  path: "/festival-of-jesus-reign",
  /** 5pm in Lagos (WAT, UTC+1). */
  startsAt: "2026-12-23T17:00:00+01:00",
  /** Not on the banner: used only for calendar entries (four hours). */
  endsAt: "2026-12-23T21:00:00+01:00",
  dateLabel: "Wednesday, 23 December 2026",
  timeLabel: "5:00 PM",
  venue: {
    name: "Life Theological Seminary",
    street: "79, Off Grammar School Junction / Filling Station",
    area: "Oke Otta-Ona",
    city: "Ikorodu",
    region: "Lagos",
  },
  phoneDisplay: "0813 743 6770",
  phoneTel: "+2348137436770",
  hosts: ["Life in the Spirit Ministries", "The New & Living Way Church, Ikorodu"],
  banner: "/FJR-flag-caricature.png",
} as const;

export const VENUE_ONE_LINE = `${FESTIVAL.venue.name}, ${FESTIVAL.venue.street}, ${FESTIVAL.venue.area}, ${FESTIVAL.venue.city}, ${FESTIVAL.venue.region}`;

export const MAPS_QUERY = encodeURIComponent(
  `${FESTIVAL.venue.name}, ${FESTIVAL.venue.area}, ${FESTIVAL.venue.city}, Lagos, Nigeria`,
);
