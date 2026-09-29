import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
            );
          } catch {}
        },
      },
    },
  );
}

/**
 * Uma única chamada de rede ao Supabase Auth por request, partilhada entre
 * middleware→layouts→page. Sem isto, uma navegação para /[orgId]/dashboard
 * chamava auth.getUser() 4x em série (layout raiz, layout da org, página) —
 * puro desperdício de tempo do Worker à espera do mesmo pedido repetido.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
