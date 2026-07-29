"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuration du cache optimisée
            staleTime: 5 * 60 * 1000, // 5 minutes de validité avant refetch en arrière-plan
            gcTime: 30 * 60 * 1000, // 30 minutes de conservation dans le garbage collector
            retry: 2, // 2 tentatives en cas d'échec avec délai exponentiel
            refetchOnWindowFocus: false, // Économise les requêtes au changement d'onglet
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
