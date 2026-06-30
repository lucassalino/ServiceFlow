'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { AppNotification } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function fetchNotificationsAction(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { data, error } = await supabase.from('notifications')
    .select('*, event:events(id, name, date)')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return data as AppNotification[];
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

export async function notifyEventSchedulesAction(
  eventId: string,
  eventName: string,
): Promise<{ notified: number }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const admin = getAdmin();

  const { data: eventMinistries, error: emError } = await admin
    .from('event_ministries').select('id').eq('event_id', eventId);
  if (emError) throw new Error(emError.message);

  const eventMinistryIds = (eventMinistries ?? []).map((em) => em.id);
  if (eventMinistryIds.length === 0) return { notified: 0 };

  const { data: schedules, error: schedulesError } = await admin
    .from('event_schedules').select('user_id').in('event_ministry_id', eventMinistryIds);
  if (schedulesError) throw new Error(schedulesError.message);

  const userIds = Array.from(new Set((schedules ?? []).map((s) => s.user_id)));
  if (userIds.length === 0) return { notified: 0 };

  const message = `Foste escalado(a) para "${eventName}". Confirma a tua presença.`;
  const rows = userIds.map((userId) => ({ user_id: userId, event_id: eventId, message }));

  const { error: insertError } = await admin.from('notifications').insert(rows);
  if (insertError) throw new Error(insertError.message);

  return { notified: userIds.length };
}
