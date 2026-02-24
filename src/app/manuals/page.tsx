import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import ManualsList from "@/components/media/ManualsList";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sunday School Manuals | NLWC Ikorodu",
  description:
    "Access Sunday School study materials and teaching resources from New and Living Way Church, Ikorodu.",
};

export default function ManualsPage() {
  return (
    <main>
      <PageHeader
        title="Sunday School Manuals"
        subtitle="Access study materials and teaching resources for our Sunday School sessions."
        backgroundImage="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop"
      />

      <SectionContainer>
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
              <p className="text-muted-foreground font-medium text-lg">
                Loading manuals...
              </p>
            </div>
          }
        >
          <ManualsList perPage={9} />
        </Suspense>
      </SectionContainer>
    </main>
  );
}
