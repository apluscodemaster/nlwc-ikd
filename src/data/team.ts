export type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string[];
};

export const team: TeamMember[] = [
  {
    id: "1",
    name: "Pst. Emeka & Pst. (Mrs.) Lilian Egwuchukwu",
    role: "Lead Pastors, NLWC Global",
    image:
      "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1776633000/mummy_and_daddy_egwuchukwu_alyhyw.jpg",
    bio: [
      "God is interested in you. He wants you to inherit His glory. He wants you to lay hold on Eternal life. God’s life cannot be compared with anything of the present. So you need to go after Him.",
      "You need to pant after His glory. That’s the best investment you can ever embark upon!",
      "We love you from our hearts. Don’t settle for anything less.",
      "God bless you!",
    ],
  },
  {
    id: "2",
    name: "Pst. Olaide & Pst. (Mrs.) Rose Olaniyan",
    role: "Resident Pastors, NLWC Ikorodu",
    image:
      "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1776633449/Pst._Laide_Pst._Rose_y6e807.png",
    bio: [
      "God is raising sons and daughters strengthened and revitalized by the Truths found in God’s word and He longs to make you one of them.",
      "Men whose souls have been rescued from the pursuit of vanity. God desires a people who willingly surrender their will to embrace the Father’s purpose. They are a yielded and nurtured people, fostering the reign of God’s kingdom in the land.",
      "These are men and women who staunchly defend against the adversary, paving the way for the return of Jesus.",
    ],
  },
];
