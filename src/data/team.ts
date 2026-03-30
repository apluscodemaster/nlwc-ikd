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
    name: "Pastor Emeka Egwuchukwu",
    role: "Senior Pastor",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247680/nlwc-ikd-assets/vyibsz1qufrjjhscuej4.jpg",
    bio: "Pastor Emeka Egwuchukwu is the visionary leader of The New & Living Way Church. With over 20 years of ministry experience, he is passionate about teaching the Word of God and helping people live purposeful lives.",
  },
  {
    id: "2",
    name: "Pastor (Mrs.) Lilian Egwuchukwu",
    role: "Senior Pastor",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247612/nlwc-ikd-assets/awsyviruot0zy7mmrsfe.png",
    bio: "Pastor (Mrs.) Lilian Egwuchukwu is a dedicated pastor who has a heart for teaching and inspiring her congregation. With a passion for the Word of God, she leads the women's ministry and helps others find spiritual growth and transformation.",
  },
  {
    id: "3",
    name: "Pastor Laide Olaniyan",
    role: "Resident Pastor",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247641/nlwc-ikd-assets/yo7bsbciytyvhd4x6bfo.png",
    bio: "Pastor Laide Olaniyan is a seasoned pastor with a proven track record of leading and inspiring his congregation. With a deep love for the Word of God, he has dedicated his life to serving the Lord and helping others find spiritual fulfillment.",
  },
  {
    id: "4",
    name: "Pastor (Mrs.) Rose Olaniyan",
    role: "Resident Pastor",
    image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247674/nlwc-ikd-assets/mwkz8g1jakp8xgxzopsg.png",
    bio: "Pastor (Mrs.) Rose Olaniyan is a dedicated pastor who has a heart for teaching and inspiring her congregation. With a passion for the Word of God, she leads the worship team and helps others find spiritual growth and transformation.",
  },
];
