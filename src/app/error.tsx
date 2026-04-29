"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging
    console.error("Route Error:", error);
  }, [error]);

  return (
    <div className="min-h-100 bg-linear-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-orange-600" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-xl font-bold text-center text-gray-900 mb-2">
          Page error
        </h1>

        {/* Error Description */}
        <p className="text-center text-gray-600 text-sm mb-6">
          This page encountered an error. Try refreshing or going back to the previous page.
        </p>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <details className="mb-6 p-3 bg-gray-50 rounded-lg text-xs">
            <summary className="font-mono font-bold cursor-pointer text-gray-700 hover:text-gray-900">
              Error Details
            </summary>
            <p className="mt-2 font-mono text-red-600 whitespace-pre-wrap wrap-break-word text-xs">
              {error.message}
            </p>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Try again
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="/"
            className="w-full bg-gray-100 text-gray-900 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center block text-sm"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
