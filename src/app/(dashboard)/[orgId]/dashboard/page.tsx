import { createClient, getAuthUser } from '@/lib/supabase/server';
import { DashboardClient } from '@/modules/dashboard/DashboardClient';
import type { Event } from '@/types/models';

interface Props { params: Promise<{ orgId: string }> }

export default async function DashboardPage({ params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: { user } } = await getAuthUser();

  // Papel, eventos e aniversariantes não dependem uns dos outros — pedidos em
  // paralelo em vez de um atrás do outro.
  const [membershipRes, eventsRes, memberRowsRes] = await Promise.all([
    supabase.from('organization_members').select('role')
      .eq('org_id', orgId).eq('user_id', user?.id ?? '').maybeSingle(),
    supabase.from('events').select('*').eq('org_id', orgId).gte('date', today).order('date'),
    supabase.from('organization_members')
      .select('user_id, profile:profiles(full_name, avatar_url, birthday)')
      .eq('org_id', orgId).eq('is_active', true),
  ]);
  const role = (membershipRes.data as { role?: string } | null)?.role;
  const canManage = role === 'admin' || role === 'leader';
  const memberRows = memberRowsRes.data;

  let visibleEvents = (eventsRes.data ?? []) as Event[];

  // Admin e líder veem tudo (incluindo rascunhos); os restantes só publicados
  // ou onde estão escalados.
  if (!canManage && user) {
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

  // ── Aniversariantes do mês ──────────────────────────────────────────────
  const currentMonth = new Date().getMonth() + 1; // 1-12

  type MemberRow = {
    profile: { full_name: string; avatar_url: string | null; birthday: string | null } | null;
  };
  const birthdayPeople = ((memberRows ?? []) as unknown as MemberRow[])
    .map((r) => r.profile)
    .filter((p): p is NonNullable<MemberRow['profile']> => !!p && !!p.birthday)
    .filter((p) => parseInt(p.birthday!.slice(5, 7), 10) === currentMonth)
    .map((p) => ({
      name: p.full_name,
      avatarUrl: p.avatar_url,
      day: parseInt(p.birthday!.slice(8, 10), 10),
      month: parseInt(p.birthday!.slice(5, 7), 10),
    }))
    .sort((a, b) => a.day - b.day);

  return (
    <DashboardClient
      upcomingEvents={upcomingEvents}
      pendingConfirmations={pendingConfirmations}
      birthdayPeople={birthdayPeople}
      orgId={orgId}
    />
  );
}
