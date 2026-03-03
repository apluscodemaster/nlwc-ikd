import { Users, UserRound, Baby, Music, HandHeart, Mic2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type Meetings = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
};

export const meetings: Meetings[] = [
  {
    id: "1",
    name: "Brothers' Meeting",
    description:
      "Raising brothers to be sound in living the life of God at home and the community.",
    icon: Users,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "2",
    name: "Chayah Sisters' Meeting",
    description:
      "A community for sisters to grow in faith, wisdom, and fellowship.",
    icon: UserRound,
    color: "bg-pink-50",
    iconColor: "text-pink-600",
  },
  {
    id: "3",
    name: "Children's Bootcamp",
    description:
      "Nurturing the next generation in the ways of the Lord through fun and learning.",
    icon: Baby,
    color: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    id: "4",
    name: "Worship Service",
    description:
      "Leading the congregation into the presence of God through music and praise.",
    icon: Music,
    color: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "5",
    name: "Prayer Meeting",
    description:
      "Praying through God's Word together, seeking guidance and transformation.",
    icon: HandHeart,
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: "6",
    name: "Sithrah",
    description: "An outreach to integrate the doctrine into our daily living.",
    icon: Mic2,
    color: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];
