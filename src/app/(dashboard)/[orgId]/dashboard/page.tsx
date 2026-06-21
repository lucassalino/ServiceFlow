import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/modules/dashboard/DashboardClient';

interface Props { params: Promise<{ orgId: string }> }

export default async function DashboardPage({ params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [eventsRes, membersRes, ministriesRes] = await Promise.all([
    supabase.from('events').select('*').eq('org_id', orgId)
      .gte('date', new Date().toISOString().split('T')[0]).order('date').limit(5),
    supabase.from('organization_members').select('id', { count: 'exact' }).eq('org_id', orgId).eq('is_active', true),
    supabase.from('ministries').select('id', { count: 'exact' }).eq('org_id', orgId),
  ]);

  return (
    <DashboardClient
      upcomingEvents={(eventsRes.data ?? []) as any}
      memberCount={membersRes.count ?? 0}
      ministryCount={ministriesRes.count ?? 0}
      orgId={orgId}
    />
  );
}
