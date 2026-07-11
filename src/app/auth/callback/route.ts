import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback de autenticação do Supabase.
 * Recebe o `code` do link de confirmação de email (ou recuperação de password),
 * troca-o por uma sessão e encaminha o utilizador para dentro da app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
