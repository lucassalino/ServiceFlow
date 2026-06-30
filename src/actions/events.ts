'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Event } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface EventPayload {
  name: string; date: string; time: string;
  location: string | null; color: string | null; cover_image_url?: string | null;
  description: string | null; observations: string | null;
}

export async function fetchEventsAction(orgId: string): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('events')
    .select('*').eq('org_id', orgId)
    .order('date', { ascending: true }).order('time', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Event[];
}

export async function createEventAction(orgId: string, payload: EventPayload): Promise<Event> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data, error } = await admin.from('events')
    .insert({ ...payload, org_id: orgId, created_by: user.id }).select().single();
  if (error) throw new Error(error.message);
  return data as Event;
}

export async function updateEventAction(id: string, payload: EventPayload): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('events')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEventAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadEventImageAction(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const file = formData.get('file') as File;
  const orgId = formData.get('orgId') as string;
  const admin = getAdmin();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from('events').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from('events').getPublicUrl(path);
  return data.publicUrl;
}

export async function publishEventAction(id: string, publish: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('events')
    .update({ is_published: publish, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
