/**
 * About-page copy, from the website's components/about/StorySection.tsx and
 * BeliefsAccordion.tsx (text only; those modules are React DOM components).
 * Keep in sync.
 */
import { BookOpen, Church, Heart, Users, type LucideIcon } from "~/components/icons";

export const STORY = {
  intro:
    "The New and Living Way Church is a New Testament church whose doctrine is built upon the truth of the holy scriptures of the New Testament Apostles and Prophets. The church is built on the tenets of the Word of Righteousness doctrine.",
  vision:
    "The Lord, by the Spirit through the Lead Pastor, ordained the New and Living Way Church to be a church that can take any believer from any level of growth to experience life within the veil—the fullness of God's Life in the Most Holy Place.",
  mission: [
    {
      title: "Mission",
      text: "Taking the word of righteousness to believers in the body of Christ through outreaches.",
    },
    { title: "Evangelism & Crusades", text: "Reaching the lost and Church Planting." },
    { title: "Sunday School", text: "Discipling the saints in the word of God." },
    { title: "Family Ministry", text: "Building strong marriages and family life for a strong local Assembly." },
  ],
  image: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247540/nlwc-ikd-assets/zq1kz50plmzpptw5rcdn.jpg",
};

export const STAND_FOR: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Church,
    title: "A Mission Church",
    description:
      "Taking the word of righteousness to believers in the body of Christ through outreaches, evangelism, crusades, and church planting.",
  },
  {
    icon: BookOpen,
    title: "Discipleship",
    description: "We disciple believers through the Sunday school platform, grounding them in the word of God.",
  },
  {
    icon: Users,
    title: "Teaching & Preaching",
    description: "We build believers by the teaching and preaching of the word of righteousness.",
  },
  {
    icon: Heart,
    title: "Strong Families",
    description:
      "We believe families and marriages should be strengthened for the building of healthy local assemblies.",
  },
];

export const BELIEFS: { title: string; content: string; scripture: string }[] = [
  {
    title: "One God, One Lord, One Spirit",
    content: "One God, One Lord, One Spirit, One baptism and One Body.",
    scripture: "Ephesians 4:4–6; 1 Corinthians 12:13",
  },
  {
    title: "The Virgin Birth of Jesus",
    content: "We believe in the virgin birth of Jesus.",
    scripture: "Isaiah 7:14; Matthew 1:18–23",
  },
  {
    title: "Death, Resurrection & Ascension",
    content: "We believe Jesus died on the cross, rose on the third day and ascended to the right hand of the Father.",
    scripture: "1 Corinthians 15:3–4; Acts 1:9",
  },
  {
    title: "New Birth by Grace",
    content:
      "We believe in new birth as the work of grace through faith in the death, burial and resurrection of Jesus from the dead.",
    scripture: "Ephesians 2:8–9; Romans 6:4",
  },
  {
    title: "Baptism of the Holy Ghost",
    content:
      "We believe in the baptism of the Holy Ghost, an experience that all believers should have after the new birth experience, with the evidence of speaking in tongues. We believe in the nine gifts of the Spirit as a tool for edifying the church.",
    scripture: "Acts 2:4; Acts 10:44–46; Acts 19:6; 1 Corinthians 12",
  },
  {
    title: "Divine Healing",
    content:
      "We believe in divine healing through Faith in the word and the gifts of the spirit (gift of special kind of faith, gift of healings and working of miracle) as contained in the Holy scriptures.",
    scripture: "1 Corinthians 12:1–9",
  },
  {
    title: "The Fivefold Ministry",
    content: "We believe in the perfecting of the saints through the fivefold ministry.",
    scripture: "Ephesians 4:11–12",
  },
  {
    title: "The Nature of Man",
    content: "We believe man is a spirit, he has a soul and lives in the body.",
    scripture: "1 Thessalonians 5:23; Hebrews 4:12",
  },
  {
    title: "The Faith of the Son",
    content:
      "We believe in the Faith of the Son as the provision of God in the scriptures for the formation of Christ in the believers through the ministry of the Holy Spirit.",
    scripture: "Galatians 2:20",
  },
  {
    title: "Salvation of the Soul",
    content: "We believe in the Salvation of the Soul as the end of our Faith.",
    scripture: "1 Peter 1:9; Hebrews 10:39",
  },
  {
    title: "The Second Coming of Jesus",
    content: "We believe in the second coming of Jesus to His Church and for His Church.",
    scripture: "John 14:3; 1 Thessalonians 4:16–17; Titus 2:13",
  },
  {
    title: "Resurrection of the Dead",
    content: "We believe in the resurrection of the dead.",
    scripture: "1 Corinthians 15:52; John 5:28–29",
  },
  {
    title: "Eternal Judgment",
    content:
      "We believe in eternal judgment and eternal damnation for those who refuse the gift of salvation through faith in the death and resurrection of Jesus Christ.",
    scripture: "Hebrews 9:27; Matthew 25:46; Revelation 20:12–15",
  },
];
