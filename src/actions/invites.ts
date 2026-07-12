'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://serviceflow.it-workdeveloper.workers.dev';

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
  if ((membership as { role?: string } | null)?.role !== 'admin') {
    throw new Error('Apenas administradores podem gerir convites');
  }
  return { admin, user };
}

/** Cria (ou atualiza) um convite com nome + email para uma organização. Só admin. */
export async function createInviteAction(
  orgId: string,
  name: string,
  email: string,
  role: 'admin' | 'leader' | 'member' = 'member',
): Promise<PendingInvite & { emailSent: boolean; alreadyRegistered: boolean }> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName) throw new Error('Escreve o nome da pessoa');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Email inválido');

  const { admin } = await requireOrgAdmin(orgId);

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

  // Envia o email de convite via Supabase (cria a conta e envia o link).
  // Se a pessoa já tiver conta, o email não é enviado — será adicionada no próximo login.
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
    data: { full_name: cleanName },
    redirectTo: `${APP_URL}/auth/callback?next=/definir-password`,
  });
  const alreadyRegistered =
    !!emailError && /already been registered|already registered|already exists/i.test(emailError.message);

  return { ...(data as PendingInvite), emailSent: !emailError, alreadyRegistered } as PendingInvite & {
    emailSent: boolean;
    alreadyRegistered: boolean;
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
