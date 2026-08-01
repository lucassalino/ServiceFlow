import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...(options as object),
              httpOnly: false,
            } as Parameters<typeof supabaseResponse.cookies.set>[2]),
          );
        },
      },
    },
  );
  const path = request.nextUrl.pathname;

  // O feed de calendário é lido pelos servidores da Google/Apple, SEM sessão —
  // se o middleware o redirecionasse para /login, a subscrição nunca funcionaria.
  // O segredo é o token no próprio URL.
  if (path.startsWith('/api/calendar/')) {
    return supabaseResponse;
  }

  // Webhook do Stripe: chamado pelos servidores do Stripe, sem sessão — a
  // autenticidade vem da assinatura verificada dentro da própria rota.
  if (path.startsWith('/api/stripe/webhook')) {
    return supabaseResponse;
  }

  // Ecrãs de autenticação: um utilizador já autenticado não deve vê-los —
  // é reencaminhado para o dashboard (ver mais abaixo).
  const isAuthPage = path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/auth');

  // Páginas informativas: acessíveis a todos, COM ou SEM sessão. Um admin a
  // ver os planos ou alguém a rever a política de privacidade não deve ser
  // reencaminhado para o dashboard.
  const isInfoPage = path.startsWith('/privacidade') ||
    path.startsWith('/suporte') ||
    path.startsWith('/planos') ||
    path.startsWith('/offline');

  const isPublicPage = isAuthPage || isInfoPage;

  // A verificação de sessão faz uma chamada de rede ao Supabase. Se essa chamada
  // falhar por rede/transitório (cold-start do Worker, blip de rede), NÃO deitamos
  // a app abaixo: deixamos o pedido passar e a própria página revalida a auth.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
  let authError: Awaited<ReturnType<typeof supabase.auth.getUser>>['error'] = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data.user;
    authError = res.error;
  } catch {
    // Erro transitório a contactar o Supabase — serve o pedido sem redirecionar.
    return supabaseResponse;
  }

  // Stale session: clear sb- cookies. If on public page serve it; otherwise redirect to login.
  if (authError && (authError.status === 400 || authError.code === 'refresh_token_not_found')) {
    const target = isPublicPage ? NextResponse.next({ request }) : (() => {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    })();
    request.cookies.getAll()
      .filter(c => c.name.startsWith('sb-'))
      .forEach(c => target.cookies.delete(c.name));
    return target;
  }

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return supabaseResponse;
}
