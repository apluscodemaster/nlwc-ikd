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
  const { session, loading, needsUsername, createSession } = useQuizSession();
  const [phase, setPhase] = useState<Phase>("launch");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/quiz/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(() => {});
  }, [result]); // re-fetch after results

  const handleStart = useCallback(async (cat: QuizCategory | null) => {
    setFetchingQuestions(true);
    try {
      setCategory(cat);
      // Start quiz directly - questions will be fetched progressively
      setPhase("playing");
    } catch (error) {
      console.error("Failed to start quiz:", error);
    } finally {
      setFetchingQuestions(false);
    }
  }, []);

  const handleComplete = useCallback((r: QuizResult) => {
    setResult(r);
    setPhase("results");
  }, []);

  const handleRetry = useCallback(() => {
    setResult(null);
    setCategory(null);
    setPhase("launch");
  }, []);

  if (loading) {
    return (
      <main>
        <PageHeader
          title="Church Quiz"
          subtitle="Test your knowledge from services and messages"
        />
        <SectionContainer>
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </SectionContainer>
      </main>
    );
  }

  return (
    <main>
      <PageHeader
        title="Church Quiz"
        subtitle="Test your knowledge from services and messages. See how you rank on the leaderboard!"
        backgroundImage="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop"
      />

      <SectionContainer>
        <div className="py-8 space-y-12">
          {/* Username prompt for new users */}
          {needsUsername ? (
            <UsernamePrompt onSubmit={createSession} />
          ) : (
            <>
              {/* Quiz phases */}
              {phase === "launch" && (
                <QuizLauncher
                  onStart={handleStart}
                  loading={fetchingQuestions}
                />
              )}

              {phase === "playing" && session && (
                <QuizPlayer
                  sessionId={session.session_id}
                  category={category}
                  onComplete={handleComplete}
                />
              )}

              {phase === "results" && result && (
                <QuizResults result={result} onRetry={handleRetry} />
              )}

              {/* Leaderboard (always visible except during play) */}
              {phase !== "playing" && (
                <Leaderboard
                  entries={leaderboard}
                  currentSessionId={session?.session_id}
                />
              )}
            </>
          )}
        </div>
      </SectionContainer>
    </main>
  );
}
