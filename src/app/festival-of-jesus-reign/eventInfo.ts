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
    street:
      "79, Obafemi Awolowo Road, Off Grammar School Junction / MRS Filling Station",
    area: "Oke Ota-Ona",
    city: "Ikorodu",
    region: "Lagos",
  },
  phoneDisplay: "0813 743 6770",
  phoneTel: "+2348137436770",
  hosts: [
    "Life in the Spirit Ministries",
    "The New & Living Way Church, Ikorodu",
  ],
  banner: "/FJR-flag-caricature.png",
  /** "Unreserved Praise" by Toluwanisings: the page's Play the sound track (loops). */
  soundtrack:
    "https://res.cloudinary.com/ds83mhjcm/video/upload/v1795636769/Unreserved_Praise_-_Toluwanisings_xuktgk.mp3",
  /** The banner on its pole, transparent around it (3:2). */
  flag: "https://res.cloudinary.com/ds83mhjcm/image/upload/v1795635145/festival_flag_sweeping_billowing_transparent_edxswl.webp",
  /** Cut-out characters on their way to the festival (2:3, transparent). */
  crowd: [
    {
      src: "https://res.cloudinary.com/ds83mhjcm/image/upload/v1795635219/Cheerful_Backpacker_in_Blue_and_Lime-1_dhnzpy.png",
      alt: "A smiling young man in a blue cap, lime T-shirt and backpack",
    },
    {
      src: "https://res.cloudinary.com/ds83mhjcm/image/upload/v1795635219/Smiling_Woman_in_Vibrant_Ankara_Dress-3_xzbysk.png",
      alt: "A smiling woman with long braids in a purple and gold Ankara dress",
    },
    {
      src: "https://res.cloudinary.com/ds83mhjcm/image/upload/v1795635219/Vibrant_Cartoon_Traveler_in_Purple-2_p4en2j.png",
      alt: "A smiling young woman in a headwrap, yellow top and purple joggers with a backpack",
    },
  ],
} as const;

export const VENUE_ONE_LINE = `${FESTIVAL.venue.name}, ${FESTIVAL.venue.street}, ${FESTIVAL.venue.area}, ${FESTIVAL.venue.city}, ${FESTIVAL.venue.region}`;

export const MAPS_QUERY = encodeURIComponent(
  `${FESTIVAL.venue.name}, ${FESTIVAL.venue.area}, ${FESTIVAL.venue.city}, Lagos, Nigeria`,
);
