"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { initializeExtensionSafeHandler } from "@/lib/extensionSafeHandler";
import { setupGlobalErrorHandlers } from "@/lib/globalErrorHandlers";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - better for static content
            gcTime: 10 * 60 * 1000, // 10 minutes - cache duration
            retry: 1, // Reduce retries to 1
            refetchOnWindowFocus: false, // Prevent refetches on tab switch
            refetchOnMount: false, // Only fetch if stale
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  // Initialize extension-safe handlers on mount
  useEffect(() => {
    initializeExtensionSafeHandler();
    setupGlobalErrorHandlers();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
