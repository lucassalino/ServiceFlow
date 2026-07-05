import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/modules/dashboard/DashboardClient';
import type { Event } from '@/types/models';

interface Props { params: Promise<{ orgId: string }> }

export default async function DashboardPage({ params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: { user } } = await supabase.auth.getUser();

  // Papel do utilizador nesta organização
  const { data: membership } = await supabase
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user?.id ?? '').maybeSingle();
  const isAdmin = (membership as { role?: string } | null)?.role === 'admin';

  const { data: eventsData } = await supabase
    .from('events').select('*').eq('org_id', orgId)
    .gte('date', today).order('date');

  let visibleEvents = (eventsData ?? []) as Event[];

  // Não-admin: apenas eventos publicados + eventos onde está escalado
  if (!isAdmin && user) {
    const { data: schedules } = await supabase
      .from('event_schedules').select('event_ministry_id').eq('user_id', user.id)
      .returns<{ event_ministry_id: string }[]>();
    const emIds = (schedules ?? []).map((s) => s.event_ministry_id);
    let scheduledIds = new Set<string>();
    if (emIds.length > 0) {
      const { data: eventMins } = await supabase
        .from('event_ministries').select('event_id').in('id', emIds)
        .returns<{ event_id: string }[]>();
      scheduledIds = new Set((eventMins ?? []).map((em) => em.event_id));
    }
    visibleEvents = visibleEvents.filter((e) => e.is_published || scheduledIds.has(e.id));
  }

  const upcomingEvents = visibleEvents.slice(0, 5);
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
