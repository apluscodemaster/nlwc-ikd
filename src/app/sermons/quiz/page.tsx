import { Metadata } from "next";
import QuizPageClient from "./QuizPageClient";

// ISR: Revalidate every 10 minutes
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Bible Quiz | Test Your Knowledge",
  description:
    "Challenge yourself with our Bible quiz based on sermons and messages from New and Living Way Church, Ikorodu. Track your score on the leaderboard and improve your knowledge of scripture.",
  keywords: [
    "Bible quiz",
    "NLWC quiz",
    "church quiz",
    "Bible knowledge test",
    "sermon quiz Ikorodu",
    "Christian quiz Nigeria",
    "scripture quiz",
  ],
  openGraph: {
    title: "Bible Quiz | NLWC Ikorodu",
    description:
      "Test your knowledge of Bible messages from NLWC. Compete on the leaderboard and learn from our sermons.",
    url: "https://ikorodu.nlwc.church/sermons/quiz",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop",
        width: 2073,
        height: 1382,
        alt: "Bible Quiz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bible Quiz | NLWC Ikorodu",
    description:
      "Test your knowledge of Bible messages from NLWC. Compete on the leaderboard.",
  },
  alternates: {
    canonical: "https://ikorodu.nlwc.church/sermons/quiz",
  },
};

export default function QuizPage() {
  return <QuizPageClient />;
}
