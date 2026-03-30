import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import DevotionalArchiveGrid from "@/components/devotionals/DevotionalArchiveGrid";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Daily Devotionals Archive | NLWC Ikorodu",
  description:
    "Browse the complete archive of daily devotionals from New and Living Way Church, Ikorodu. Read or download past devotional materials.",
};

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export default function DevotionalsArchivePage() {
  return (
    <main>
      <PageHeader
        title="Daily Devotionals"
        subtitle="Browse our collection of daily devotional materials to enrich your walk with God."
        backgroundImage="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-medium text-lg">
                Loading devotionals...
              </p>
            </div>
          }
        >
          <DevotionalArchiveGrid />
        </Suspense>
      </SectionContainer>
    </main>
  );
}
