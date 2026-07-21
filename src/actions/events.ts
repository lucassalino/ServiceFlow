'use server';

import { createClient } from '@/lib/supabase/server';
import type { Event } from '@/types/models';

/** IDs dos eventos onde o utilizador está escalado (usado nas regras de visibilidade). */
async function scheduledEventIdSet(
  client: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Set<string>> {
  const { data: schedules } = await client
    .from('event_schedules').select('event_ministry_id').eq('user_id', userId);
  const emIds = (schedules ?? []).map((s: { event_ministry_id: string }) => s.event_ministry_id);
  if (emIds.length === 0) return new Set();
  const { data: eventMins } = await client
    .from('event_ministries').select('event_id').in('id', emIds);
  return new Set((eventMins ?? []).map((em: { event_id: string }) => em.event_id));
}

export interface EventPayload {
  name: string; date: string; time: string; arrival_time?: string | null;
  location: string | null; color: string | null; cover_image_url?: string | null;
  description: string | null; observations: string | null;
  is_published?: boolean;
}

export async function fetchEventsAction(orgId: string): Promise<Event[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  // Papel do utilizador nesta organização
  const { data: membership } = await supabase
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  const isAdmin = (membership as { role?: string } | null)?.role === 'admin';

  // RLS ("events: org members can read") já restringe às organizações do
  // utilizador — o filtro de orgId abaixo é só para a query, não é ele que
  // impede ver eventos de outras organizações.
  const { data, error } = await supabase.from('events')
    .select('*').eq('org_id', orgId)
    .order('date', { ascending: true }).order('time', { ascending: true });
  if (error) throw new Error(error.message);
  const all = (data ?? []) as Event[];

  // Admin vê tudo (incluindo rascunhos)
  if (isAdmin) return all;

  // Não-admin: apenas eventos publicados + eventos onde está escalado
  const scheduledIds = await scheduledEventIdSet(supabase, user.id);
  return all.filter((e) => e.is_published || scheduledIds.has(e.id));
}

export async function createEventAction(orgId: string, payload: EventPayload): Promise<Event> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  // RLS ("events: admins/leaders can write") rejeita quem não for admin/líder
  // desta organização — não há checagem de papel a fazer aqui em cima.
  const { data, error } = await supabase.from('events')
    .insert({ ...payload, org_id: orgId, created_by: user.id }).select().single();
  if (error) throw new Error(error.message);
  return data as Event;
}

export async function updateEventAction(id: string, payload: EventPayload): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  // RLS ("events: admins/leaders can update") impede editar eventos de
  // organizações onde não se é admin/líder.
  const { error } = await supabase.from('events')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEventAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  // RLS ("events: admins can delete") impede eliminar eventos de
  // organizações onde não se é admin.
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadEventImageAction(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const file = formData.get('file') as File;
  const orgId = formData.get('orgId') as string;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from('events').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('events').getPublicUrl(path);
  return data.publicUrl;
}

export async function publishEventAction(id: string, publish: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  // RLS ("events: admins/leaders can update") cobre também o toggle de publicação.
  const { error } = await supabase.from('events')
    .update({ is_published: publish, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
