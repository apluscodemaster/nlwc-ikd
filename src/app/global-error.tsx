"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error for debugging
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-linear-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-center text-gray-600 text-sm mb-6">
              We encountered an unexpected error. Please try again or contact support if the problem
              persists.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === "development" && (
              <details className="mb-6 p-3 bg-gray-50 rounded-lg text-xs">
                <summary className="font-mono font-bold cursor-pointer text-gray-700 hover:text-gray-900">
                  Error Details
                </summary>
                <p className="mt-2 font-mono text-red-600 whitespace-pre-wrap wrap-break-word">
                  {error.message}
                </p>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Try again
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/"
                className="w-full bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center block"
              >
                Go back home
              </a>
            </div>

            {/* Support Link */}
            <p className="text-center text-xs text-gray-500 mt-6">
              Need help?{" "}
              <a href="/contact" className="text-primary hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
