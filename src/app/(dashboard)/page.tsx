import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OrgSelectionClient } from '@/modules/organizations/OrgSelectionClient';
import { acceptPendingInvitesAction } from '@/actions/invites';
import type { OrganizationMember, Organization } from '@/types/models';

type MemberWithOrg = OrganizationMember & { organization: Organization };

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Processa convites pendentes para o email desta pessoa (adiciona-a às organizações).
  await acceptPendingInvitesAction();

  const { data } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const memberships = (data ?? []) as unknown as MemberWithOrg[];

  if (memberships.length === 0) {
    return <OrgSelectionClient initialMemberships={memberships} />;
  }

  // Entrar direto na última organização visitada (se ainda for membro dela).
  const lastOrg = (await cookies()).get('sf_last_org')?.value;
  if (lastOrg && memberships.some((m) => m.org_id === lastOrg)) {
    redirect(`/${lastOrg}/dashboard`);
  }

  // Sem cookie válido: se só houver uma organização, entra direto nela.
  if (memberships.length === 1) redirect(`/${memberships[0].org_id}/dashboard`);

  return <OrgSelectionClient initialMemberships={memberships} />;
}
