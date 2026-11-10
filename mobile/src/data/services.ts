/**
 * Meetings shown under "Service times" on Home. Data copied from the
 * website's src/data/services.ts (which imports lucide-react web icons, so it
 * can't be shared directly; docs/ARCHITECTURE.md §5.4). Keep times in sync.
 *
 * App-specific choices: Sithrah isn't listed (the website still shows it),
 * and the icons differ (church, praying hands, open Bible).
 */
import { BookOpen, Church, PrayingHands, Sparkles, type LucideIcon } from "~/components/icons";

export interface Service {
  id: number;
  name: string;
  day: string;
  time: string;
  location: string;
  description: string;
  icon: LucideIcon;
  image?: string;
}

export const services: Service[] = [
  {
    id: 1,
    name: "Sunday Service",
    day: "Sundays",
    time: "8:00 AM",
    location: "Church Auditorium",
    description: "Join us for an uplifting morning of worship and transformative teaching.",
    icon: Church,
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1775202517/Sunday-service_yqnt8b.jpg",
  },
  {
    id: 2,
    name: "Prayer Meeting",
    day: "Wednesdays",
    time: "6:00 PM",
    location: "Church Auditorium",
    description: "Standing together in faith and interceding for our community.",
    icon: PrayingHands,
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247627/nlwc-ikd-assets/m6cvj4hlycpdwzd61vfh.avif",
  },
  {
    id: 3,
    name: "Bible Study",
    day: "Fridays",
    time: "6:00 PM",
    location: "Church Auditorium",
    description: "Deep dive into God's word and grow in your understanding of faith.",
    icon: BookOpen, // open Bible
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247542/nlwc-ikd-assets/pm8b0f37oyetsclcesg7.avif",
  },
  {
    id: 5,
    name: "Season of the Spirit",
    day: "Feb - March",
    time: "8:00 AM",
    location: "Church Auditorium",
    description: "A special season of spiritual refreshing and prophetic advancement.",
    icon: Sparkles,
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247798/nlwc-ikd-assets/nu4dqvqovsnbodckjmnu.avif",
  },
];
