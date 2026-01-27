import { Users, Heart, Baby, Music, BookOpen, Mic2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type Ministry = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
};

export const ministries: Ministry[] = [
  {
    id: "1",
    name: "Men's Ministry",
    description:
      "Empowering men to be spiritual leaders in their homes and community.",
    icon: Users,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "2",
    name: "Women's Ministry",
    description:
      "A community for women to grow in faith, wisdom, and fellowship.",
    icon: Heart,
    color: "bg-pink-50",
    iconColor: "text-pink-600",
  },
  {
    id: "3",
    name: "Children's Church",
    description:
      "Nurturing the next generation in the ways of the Lord through fun and learning.",
    icon: Baby,
    color: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    id: "4",
    name: "Worship Team",
    description:
      "Leading the congregation into the presence of God through music and praise.",
    icon: Music,
    color: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "5",
    name: "Bible Study",
    description:
      "Deepening our understanding of scripted through systematic study and discussion.",
    icon: BookOpen,
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: "6",
    name: "Media & Tech",
    description:
      "Using technology to spread the gospel through live streams and recordings.",
    icon: Mic2,
    color: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];
