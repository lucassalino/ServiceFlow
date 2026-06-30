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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const isPublicPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/offline');

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
  if (user && isPublicPage && !request.nextUrl.pathname.startsWith('/offline')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return supabaseResponse;
}
