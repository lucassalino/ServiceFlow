// Helper partilhado para ligar músicas ao catálogo global (dedup por nome+artista).
// Não é um Server Action — recebe o cliente Supabase como argumento, para poder
// ser reutilizado por várias actions (criar música, importar setlist, etc.).
import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Campos partilhados no catálogo global (o Tom NÃO é partilhado). */
export const SHARED_KEYS = ['lyrics', 'chords', 'youtube_url', 'spotify_url', 'bpm'] as const;

/** Dados mínimos de uma música para resolver a entrada no catálogo. */
export interface CatalogInput {
  name: string;
  artist: string | null;
  lyrics?: string | null;
  chords?: string | null;
  youtube_url?: string | null;
  spotify_url?: string | null;
  bpm?: number | null;
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

/**
 * Liga uma música ao catálogo global pela chave (nome + artista).
 * - Se já existir: contribui apenas os campos que estão VAZIOS no catálogo
 *   (nunca sobrescreve dados de outra igreja).
 * - Se não existir: cria a entrada no catálogo.
 * Devolve o id da entrada do catálogo.
 */
export async function resolveCatalog(
  supabase: SupabaseServerClient, payload: CatalogInput, orgId: string, userId: string,
): Promise<string | null> {
  const name = payload.name.trim();
  const artist = (payload.artist ?? '').trim();
  if (!name) return null;
  const esc = (s: string) => s.replace(/[%_]/g, '\\$&');

  const { data: found } = await supabase.from('catalog_songs').select('*')
    .ilike('name', esc(name)).ilike('artist', esc(artist)).limit(1).maybeSingle();
  const cat = found as Record<string, unknown> | null;

  if (cat) {
    const patch: Record<string, unknown> = {};
    for (const k of SHARED_KEYS) {
      if (isEmpty(cat[k]) && !isEmpty(payload[k])) patch[k] = payload[k];
    }
    if (Object.keys(patch).length > 0) {
      patch.updated_at = new Date().toISOString();
      await supabase.from('catalog_songs').update(patch as never).eq('id', cat.id as string);
    }
    return cat.id as string;
  }

  const { data: created, error } = await supabase.from('catalog_songs').insert({
    name, artist,
    lyrics: payload.lyrics ?? null, chords: payload.chords ?? null,
    youtube_url: payload.youtube_url ?? null, spotify_url: payload.spotify_url ?? null,
    bpm: payload.bpm ?? null, source_org_id: orgId, created_by: userId,
  }).select('id').single();

  if (error) {
    // corrida: outra igreja criou a mesma entrada — procurar de novo
    const { data: retry } = await supabase.from('catalog_songs').select('id')
      .ilike('name', esc(name)).ilike('artist', esc(artist)).limit(1).maybeSingle();
    return (retry as { id: string } | null)?.id ?? null;
  }
  return (created as { id: string }).id;
}
