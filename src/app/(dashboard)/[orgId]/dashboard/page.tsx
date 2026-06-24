import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/modules/dashboard/DashboardClient';
import type { Event } from '@/types/models';

interface Props { params: Promise<{ orgId: string }> }

export default async function DashboardPage({ params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const [eventsRes, membersRes, ministriesRes, songsRes] = await Promise.all([
    supabase.from('events').select('*').eq('org_id', orgId)
      .gte('date', today).order('date').limit(5),
    supabase.from('organization_members').select('id', { count: 'exact' }).eq('org_id', orgId).eq('is_active', true),
    supabase.from('ministries').select('id', { count: 'exact' }).eq('org_id', orgId),
    supabase.from('songs').select('id', { count: 'exact' }).eq('org_id', orgId),
  ]);

  const upcomingEvents = (eventsRes.data ?? []) as Event[];
  const upcomingEventIds = upcomingEvents.map((e) => e.id);

  // Pendências de confirmação nos próximos eventos
  let pendingConfirmations = 0;
  if (upcomingEventIds.length > 0) {
    const { data: eventMinistries } = await supabase
      .from('event_ministries')
      .select('id')
      .in('event_id', upcomingEventIds)
      .returns<{ id: string }[]>();

    const eventMinistryIds = (eventMinistries ?? []).map((em) => em.id);
    if (eventMinistryIds.length > 0) {
      const { count } = await supabase
        .from('event_schedules')
        .select('id', { count: 'exact' })
        .in('event_ministry_id', eventMinistryIds)
        .is('confirmed', null);
      pendingConfirmations = count ?? 0;
    }
  }

  return (
    <DashboardClient
      upcomingEvents={upcomingEvents}
      memberCount={membersRes.count ?? 0}
      ministryCount={ministriesRes.count ?? 0}
      songCount={songsRes.count ?? 0}
      pendingConfirmations={pendingConfirmations}
      orgId={orgId}
    />
  );
}
