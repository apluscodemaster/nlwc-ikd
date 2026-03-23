import {
  Calendar,
  Users,
  LucideIcon,
  Book,
  Flame,
  Sparkles,
} from "lucide-react";

export type Service = {
  id: number;
  name: string;
  day: string;
  time: string;
  location: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  image?: string;
};

export const services: Service[] = [
  {
    id: 1,
    name: "Sunday Service",
    day: "Sundays",
    time: "8:00 AM",
    location: "Church Auditorium",
    description:
      "Join us for an uplifting morning of worship and transformative teaching.",
    icon: Calendar,
    color: "bg-orange-50",
    iconColor: "text-orange-600",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247806/nlwc-ikd-assets/fzoehwwcmsuwx7w9y3pt.avif",
  },
  {
    id: 2,
    name: "Prayer Meeting",
    day: "Wednesdays",
    time: "6:00 PM",
    location: "Church Auditorium",
    description:
      "Standing together in faith and interceding for our community.",
    icon: Users,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247627/nlwc-ikd-assets/m6cvj4hlycpdwzd61vfh.avif",
  },
  {
    id: 3,
    name: "Bible Study",
    day: "Fridays",
    time: "6:00 PM",
    location: "Church Auditorium",
    description:
      "Deep dive into God's word and grow in your understanding of faith.",
    icon: Book,
    color: "bg-green-50",
    iconColor: "text-green-600",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247542/nlwc-ikd-assets/pm8b0f37oyetsclcesg7.avif",
  },
  {
    id: 4,
    name: "Sithrah",
    day: "2nd Sat Monthly",
    time: "12:00 PM",
    location: "Church Auditorium",
    description:
      "A special monthly time of prayer and spiritual refreshing before the Lord.",
    icon: Flame,
    color: "bg-purple-50",
    iconColor: "text-purple-600",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247787/nlwc-ikd-assets/taxdkmtwzd7rn1np8wfm.avif",
  },
  {
    id: 5,
    name: "Season of the Spirit",
    day: "Feb - March",
    time: "8:00 AM",
    location: "Church Auditorium",
    description:
      "A special season of spiritual refreshing and prophetic advancement.",
    icon: Sparkles,
    color: "bg-amber-50",
    iconColor: "text-amber-600",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247798/nlwc-ikd-assets/nu4dqvqovsnbodckjmnu.avif",
  },
];
