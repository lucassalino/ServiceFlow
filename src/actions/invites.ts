'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { APP_URL } from '@/lib/app-url';
import { canAddResource } from '@/actions/subscriptions';
import { PLAN_LIMIT_CODE, type PlanGuarded } from '@/lib/plan-limits';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface PendingInvite {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

async function requireOrgAdmin(orgId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data: membership } = await admin
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).single();
  const role = (membership as { role?: string } | null)?.role;
  // Admins e líderes podem gerir convites (criar/cancelar).
  if (role !== 'admin' && role !== 'leader') {
    throw new Error('Apenas administradores ou líderes podem gerir convites');
  }
  return { admin, user };
}

/** Cria (ou atualiza) um convite com nome + email para uma organização. Só admin. */
export async function createInviteAction(
  orgId: string,
  name: string,
  email: string,
  role: 'admin' | 'leader' | 'member' = 'member',
): Promise<PlanGuarded<PendingInvite & { emailSent: boolean; alreadyRegistered: boolean }>> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName) throw new Error('Escreve o nome da pessoa');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Email inválido');

  const { admin } = await requireOrgAdmin(orgId);

  // Limite de pessoas do plano (membros ativos + convites pendentes).
  const peopleLimit = await canAddResource(orgId, 'people');
  if (!peopleLimit.allowed) {
    return {
      ok: false, code: PLAN_LIMIT_CODE, resource: 'people',
      used: peopleLimit.used, limit: peopleLimit.limit, planName: peopleLimit.planName,
    };
  }

  // Convidar alguém já como admin também consome o limite de admins.
  if (role === 'admin') {
    const adminLimit = await canAddResource(orgId, 'admin');
    if (!adminLimit.allowed) {
      return {
        ok: false, code: PLAN_LIMIT_CODE, resource: 'admin',
        used: adminLimit.used, limit: adminLimit.limit, planName: adminLimit.planName,
      };
    }
  }

  // Já é membro?
  const { data: existingProfile } = await admin
    .from('profiles').select('id').eq('email', cleanEmail).maybeSingle();
  if (existingProfile) {
    const { data: existingMember } = await admin
      .from('organization_members').select('id')
      .eq('org_id', orgId).eq('user_id', (existingProfile as { id: string }).id).maybeSingle();
    if (existingMember) throw new Error('Essa pessoa já é membro desta organização');
  }

  const { data, error } = await admin
    .from('organization_invites')
    .upsert(
      { org_id: orgId, email: cleanEmail, name: cleanName, role, accepted_at: null },
      { onConflict: 'org_id,email' },
    )
    .select('id, org_id, email, name, role, created_at')
    .single();
  if (error) throw new Error(error.message);

  // Envia o email de convite via Supabase (cria a conta e envia o link para
  // definir a password). Se a pessoa já tiver conta, o Supabase devolve erro.
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
    data: { full_name: cleanName },
    redirectTo: `${APP_URL}/auth/callback?next=/definir-password`,
  });
  const alreadyRegistered =
    !!emailError && /already been registered|already registered|already exists/i.test(emailError.message);

  // Se já tem conta, não precisa de criar password: enviamos um magic link
  // para ela entrar direto. Ao entrar, é adicionada à organização automaticamente
  // (via acceptPendingInvitesAction). Assim recebe sempre um email.
  let emailSent = !emailError;
  if (alreadyRegistered) {
    const anon = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error: magicError } = await anon.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${APP_URL}/auth/callback?next=/`,
      },
    });
    emailSent = !magicError;
  }

  return {
    ok: true,
    data: { ...(data as PendingInvite), emailSent, alreadyRegistered },
  };
}

/** Lista os convites pendentes (ainda não aceites) de uma organização. Só admin. */
export async function fetchPendingInvitesAction(orgId: string): Promise<PendingInvite[]> {
  const { admin } = await requireOrgAdmin(orgId);
  const { data, error } = await admin
    .from('organization_invites')
    .select('id, org_id, email, name, role, created_at')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingInvite[];
}

/** Cancela um convite pendente. Só admin. */
export async function deleteInviteAction(orgId: string, inviteId: string): Promise<void> {
  const { admin } = await requireOrgAdmin(orgId);
  const { error } = await admin
    .from('organization_invites').delete().eq('id', inviteId).eq('org_id', orgId);
  if (error) throw new Error(error.message);
}

/**
 * Aceita automaticamente os convites pendentes para o email do utilizador atual.
 * Adiciona-o às organizações e aplica o nome do convite ao perfil (se ainda não tiver nome).
 * Deve ser chamada após o login (ex.: na página inicial).
 */
export async function acceptPendingInvitesAction(): Promise<number> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email) return 0;
  const admin = getAdmin();
  const email = user.email.toLowerCase();

  const { data: invites } = await admin
    .from('organization_invites')
    .select('id, org_id, name, role')
    .eq('email', email)
    .is('accepted_at', null);

  const list = (invites ?? []) as { id: string; org_id: string; name: string; role: string }[];
  if (list.length === 0) return 0;

  // Nome atual do perfil (para decidir se aplicamos o nome do convite).
  const { data: profile } = await admin
    .from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const currentName = (profile as { full_name?: string } | null)?.full_name?.trim() ?? '';

  let accepted = 0;
  for (const inv of list) {
    // Já é membro?
    const { data: member } = await admin
      .from('organization_members').select('id, is_active')
      .eq('org_id', inv.org_id).eq('user_id', user.id).maybeSingle();

    if (!member) {
      const { error: insErr } = await admin.from('organization_members').insert({
        org_id: inv.org_id, user_id: user.id,
        role: inv.role as 'admin' | 'leader' | 'member', is_active: true,
      });
      if (insErr) continue;
    } else if (!(member as { is_active: boolean }).is_active) {
      await admin.from('organization_members').update({ is_active: true })
        .eq('id', (member as { id: string }).id);
    }

    // Aplica o nome do convite se o perfil ainda não tiver nome definido.
    if (!currentName && inv.name) {
      await admin.from('profiles').update({ full_name: inv.name, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    await admin.from('organization_invites')
      .update({ accepted_at: new Date().toISOString() }).eq('id', inv.id);
    accepted += 1;
  }

  return accepted;
}
