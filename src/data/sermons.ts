export type Sermon = {
  id: number;
  title: string;
  speaker: string;
  date: string;
  thumbnail: string;
  type: "video" | "audio";
};

export const recentSermons: Sermon[] = [
  {
    id: 1,
    title: "Walking in Divine Purpose",
    speaker: "Pastor Laide Olaniyan",
    date: "Jan 26, 2026",
    thumbnail: "https://picsum.photos/id/18/300/200",
    type: "video",
  },
  {
    id: 2,
    title: "The Power of Persistent Prayer",
    speaker: "Assoc. Pastor Segun",
    date: "Jan 19, 2026",
    thumbnail: "https://picsum.photos/id/22/300/200",
    type: "audio",
  },
  {
    id: 3,
    title: "Grace for the New Season",
    speaker: "Pastor Laide Olaniyan",
    date: "Jan 12, 2026",
    thumbnail: "https://picsum.photos/id/24/300/200",
    type: "video",
  },
  {
    id: 4,
    title: "Understanding Covenant Promises",
    speaker: "Pastor Laide Olaniyan",
    date: "Jan 05, 2026",
    thumbnail:
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=600&auto=format&fit=crop",
    type: "audio",
  },
  {
    id: 5,
    title: "Faith in the Midst of Storms",
    speaker: "Assoc. Pastor Segun",
    date: "Dec 29, 2025",
    thumbnail: "https://picsum.photos/id/41/300/200",
    type: "video",
  },
  {
    id: 6,
    title: "The Joy of Serving God",
    speaker: "Pastor (Mrs.) Olaniyan",
    date: "Dec 22, 2025",
    thumbnail: "https://picsum.photos/id/80/300/200",
    type: "audio",
  },
];
