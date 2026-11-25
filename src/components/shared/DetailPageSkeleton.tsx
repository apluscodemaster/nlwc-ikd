import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder for a content detail page (sermon, transcript, manual, video)
 * while it is loaded on the server: a header band, a title and body lines,
 * roughly the shape of the real page so nothing jumps when it arrives.
 */
export default function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/30" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-56 sm:h-72 w-full bg-gray-200/70 animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-4/5" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3 pt-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
