import { BookOpen } from "lucide-react";

/** Shown while the devotional is loaded on the server. */
export default function DevotionalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50/30">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
        <BookOpen className="w-8 h-8 text-primary absolute inset-0 m-auto" />
      </div>
      <p className="text-muted-foreground font-bold text-xl animate-pulse">
        Opening Devotional...
      </p>
    </div>
  );
}
