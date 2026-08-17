'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    let client!: QueryClient;
    // Após QUALQUER mutação bem-sucedida (criar/gravar/editar/apagar),
    // recarrega todos os dados para que todas as telas fiquem atualizadas.
    const mutationCache = new MutationCache({
      onSuccess: () => { client.invalidateQueries(); },
    });
    client = new QueryClient({
      mutationCache,
      defaultOptions: {
        queries: { staleTime: 30 * 1000, retry: 1, refetchOnWindowFocus: true },
      },
    });
    return client;
  });
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          {children}
          <Toaster richColors position="top-right" />
        </AuthInitializer>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
