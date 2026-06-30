import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { OrgInitializer } from '@/modules/organizations/OrgInitializer';
import type { Organization, OrganizationMember, UserProfile } from '@/types/models';

interface Props {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*), profile:profiles(*)')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/');

  const typedMembership = membership as OrganizationMember & {
    organization: Organization;
    profile: UserProfile;
  };

  return (
    <OrgInitializer membership={typedMembership}>
      <AppShell orgId={orgId}>
        {children}
      </AppShell>
    </OrgInitializer>
  );
}
