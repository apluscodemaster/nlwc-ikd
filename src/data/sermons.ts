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
    thumbnail:
      "https://images.unsplash.com/photo-1511649475106-4ab986b6bc74?q=80&w=600&auto=format&fit=crop",
    type: "video",
  },
  {
    id: 2,
    title: "The Power of Persistent Prayer",
    speaker: "Assoc. Pastor Segun",
    date: "Jan 19, 2026",
    thumbnail:
      "https://images.unsplash.com/photo-1507692049790-de58290a423d?q=80&w=600&auto=format&fit=crop",
    type: "audio",
  },
  {
    id: 3,
    title: "Grace for the New Season",
    speaker: "Pastor Laide Olaniyan",
    date: "Jan 12, 2026",
    thumbnail:
      "https://images.unsplash.com/photo-1444464666168-49d633b867ad?q=80&w=600&auto=format&fit=crop",
    type: "video",
  },
];
