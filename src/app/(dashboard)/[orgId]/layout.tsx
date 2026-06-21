import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { OrgInitializer } from '@/modules/organizations/OrgInitializer';

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

  return (
    <OrgInitializer membership={membership as any}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar orgId={orgId} />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </OrgInitializer>
  );
}
