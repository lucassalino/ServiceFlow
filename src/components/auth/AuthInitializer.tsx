'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Mantém o authStore sincronizado com a sessão Supabase ao longo de
 * toda a app: define a sessão inicial e escuta mudanças (login,
 * logout, refresh de token) via onAuthStateChange.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, [setSession, setLoading]);

  return <>{children}</>;
}
