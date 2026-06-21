import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrgSelectionClient } from '@/modules/organizations/OrgSelectionClient';
import type { OrganizationMember, Organization } from '@/types/models';

type MemberWithOrg = OrganizationMember & { organization: Organization };

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const memberships = (data ?? []) as unknown as MemberWithOrg[];
  if (memberships.length === 1) redirect(`/${memberships[0].org_id}/dashboard`);

  return <OrgSelectionClient initialMemberships={memberships} />;
}
