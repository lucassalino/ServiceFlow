import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/modules/dashboard/DashboardClient';
import type { Event } from '@/types/models';

interface Props { params: Promise<{ orgId: string }> }

export default async function DashboardPage({ params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: eventsData } = await supabase
    .from('events').select('*').eq('org_id', orgId)
    .gte('date', today).order('date').limit(5);

  const upcomingEvents = (eventsData ?? []) as Event[];
  const upcomingEventIds = upcomingEvents.map((e) => e.id);

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
      pendingConfirmations={pendingConfirmations}
      orgId={orgId}
    />
  );
}
