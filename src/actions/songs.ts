'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Song } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface SongPayload {
  name: string; artist: string | null; musical_key: string | null;
  bpm: number | null; lyrics: string | null; chords: string | null; youtube_url: string | null;
}

export async function fetchSongsAction(orgId: string): Promise<Song[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('songs')
    .select('*').eq('org_id', orgId).order('name');
  if (error) throw new Error(error.message);
  return data as Song[];
}

export async function createSongAction(orgId: string, payload: SongPayload): Promise<Song> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data, error } = await admin.from('songs')
    .insert({ ...payload, org_id: orgId }).select().single();
  if (error) throw new Error(error.message);
  return data as Song;
}

export async function updateSongAction(id: string, payload: SongPayload): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('songs')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSongAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('songs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
