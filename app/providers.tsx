"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

import { LinkPreviewProvider } from "@/components/ui/link-preview-panel";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <LinkPreviewProvider>
          {children}
        </LinkPreviewProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

