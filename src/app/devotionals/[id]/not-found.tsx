import Link from "next/link";
import { AlertCircle, Library } from "lucide-react";

/** A devotional id that does not exist (or was removed). */
export default function DevotionalNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-gray-50/30">
      <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center shadow-inner">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mt-4">
        Devotional not found
      </h2>
      <p className="text-gray-500 mb-6 font-medium">
        It might have been moved or removed.
      </p>
      <Link
        href="/devotionals"
        className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
      >
        <Library className="w-5 h-5" />
        Browse Archive
      </Link>
    </div>
  );
}
