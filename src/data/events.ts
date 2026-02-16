export type ChurchEvent = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
};

export const upcomingEvents: ChurchEvent[] = [
  {
    id: 1,
    title: "Singlz Summit",
    date: "Feb 15 - 18",
    time: "4:00 PM Daily",
    location: "Main Sanctuary",
    category: "Convention",
  },
  {
    id: 2,
    title: "Worship Service",
    date: "Feb 27",
    time: "10:00 PM",
    location: "Church Premises",
    category: "Vigil",
  },
  {
    id: 3,
    title: "Couple's Dinner & Retreat",
    date: "Mar 14",
    time: "5:00 PM",
    location: "Event Center",
    category: "Fellowship",
  },
];
