import { Calendar, Heart, Users, LucideIcon } from "lucide-react";

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
};

export const services: Service[] = [
  {
    id: 1,
    name: "Sunday Service",
    day: "Sunday",
    time: "8:00 AM",
    location: "Main Sanctuary",
    description:
      "Join us for an uplifting morning of worship and transformative teaching.",
    icon: Calendar,
    color: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: 2,
    name: "Bible Study",
    day: "Wednesday",
    time: "6:00 PM",
    location: "Church Auditorium",
    description:
      "Deep dive into God's word and grow in your understanding of faith.",
    icon: Heart,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 3,
    name: "Prayer Meeting",
    day: "Friday",
    time: "5:00 PM",
    location: "Prayer Room",
    description:
      "Standing together in faith and interceding for our community.",
    icon: Users,
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
];
