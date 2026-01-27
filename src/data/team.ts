export type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
};

export const team: TeamMember[] = [
  {
    id: "1",
    name: "Pastor Laide Olaniyan",
    role: "Senior Pastor",
    image:
      "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1000&auto=format&fit=crop",
    bio: "Pastor Laide Olaniyan is the visionary leader of The New & Living Way Church. With over 20 years of ministry experience, he is passionate about teaching the Word of God and helping people live purposeful lives.",
  },
  {
    id: "2",
    name: "Pastor (Mrs.) Olaniyan",
    role: "Co-Pastor",
    image:
      "https://images.unsplash.com/photo-1511649475106-4ab986b6bc74?q=80&w=1000&auto=format&fit=crop",
    bio: "Pastor (Mrs.) Olaniyan serves alongside her husband, leading the women's ministry and overseeing various community outreach programs.",
  },
  {
    id: "3",
    name: "Deacon John Doe",
    role: "Head of Operations",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop",
    bio: "Deacon John Doe manages the church's daily operations and ensures all services and events run smoothly.",
  },
  {
    id: "4",
    name: "Sis. Jane Smith",
    role: "Worship Leader",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
    bio: "Sis. Jane leads the worship team, creating an atmosphere of praise and encounter in every service.",
  },
];
