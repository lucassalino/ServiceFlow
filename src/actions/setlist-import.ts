'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveCatalog } from '@/lib/songs-catalog';
import type { SongDraft } from '@/lib/import/setlist-schema';

export interface ImportedSong {
  /** Índice da linha no CSV (para manter a ordem). */
  index: number;
  songId: string;
  name: string;
  artist: string | null;
  /** Tom vindo do CSV (aplica-se à setlist, não sobrescreve o tom da música). */
  musical_key: string | null;
  /** 'matched' = já existia no repertório; 'created' = criada agora. */
  status: 'matched' | 'created';
}

export interface ImportSetlistResult {
  songs: ImportedSong[];
  createdCount: number;
  matchedCount: number;
}

function norm(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Recebe músicas de um CSV e devolve os IDs no repertório da organização:
 * - Se já existe uma música com o mesmo nome+artista, reutiliza-a.
 * - Caso contrário, cria a música (ligando ao catálogo global).
 * NÃO grava a setlist — devolve os IDs para o editor de evento os usar.
 */
export async function importSetlistSongsAction(
  orgId: string, drafts: SongDraft[],
): Promise<ImportSetlistResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  // Repertório atual da organização, para casar por nome+artista.
  const { data: existingRaw, error: exErr } = await supabase
    .from('songs').select('id, name, artist').eq('org_id', orgId);
  if (exErr) throw new Error(exErr.message);
  const existing = (existingRaw ?? []) as { id: string; name: string; artist: string | null }[];

  const byKey = new Map<string, string>();
  for (const s of existing) byKey.set(`${norm(s.name)}|${norm(s.artist)}`, s.id);

  const out: ImportedSong[] = [];
  let created = 0;
  let matched = 0;

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const name = d.name.trim();
    if (!name) continue;

    const key = `${norm(name)}|${norm(d.artist)}`;
    const existingId = byKey.get(key);

    if (existingId) {
      out.push({ index: i, songId: existingId, name, artist: d.artist,
        musical_key: d.musical_key, status: 'matched' });
      matched++;
      continue;
    }

    // Cria a música no repertório (com dedup no catálogo global).
    const catalogId = await resolveCatalog(
      supabase,
      {
        name, artist: d.artist, bpm: d.bpm,
        youtube_url: d.youtube_url, spotify_url: d.spotify_url,
        chords: d.chords, lyrics: d.lyrics,
      },
      orgId, user.id,
    );
    const { data: inserted, error: insErr } = await supabase.from('songs').insert({
      name, artist: d.artist, musical_key: d.musical_key, bpm: d.bpm,
      duration: d.duration, bible_reference: d.bible_reference,
      youtube_url: d.youtube_url, spotify_url: d.spotify_url,
      chords: d.chords, lyrics: d.lyrics, cover_image_url: d.cover_image_url,
      org_id: orgId, catalog_song_id: catalogId,
    } as never).select('id').single();
    if (insErr) throw new Error(insErr.message);

    const newId = (inserted as { id: string }).id;
    byKey.set(key, newId); // evita duplicados dentro do próprio CSV
    out.push({ index: i, songId: newId, name, artist: d.artist,
      musical_key: d.musical_key, status: 'created' });
    created++;
  }

  return { songs: out, createdCount: created, matchedCount: matched };
}
