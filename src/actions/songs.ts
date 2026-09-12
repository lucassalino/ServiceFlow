'use server';

import { createClient } from '@/lib/supabase/server';
import type { Song } from '@/types/models';
import { resolveCatalog } from '@/lib/songs-catalog';

export interface SongPayload {
  name: string; artist: string | null; musical_key: string | null;
  bpm: number | null; lyrics: string | null; chords: string | null;
  youtube_url: string | null; spotify_url: string | null; ministry_id: string | null;
  duration: string | null; bible_reference: string | null;
}

export async function fetchSongsAction(orgId: string): Promise<Song[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('songs')
    .select('*').eq('org_id', orgId).order('name');
  if (error) throw new Error(error.message);
  return data as Song[];
}

export interface SongRankingEntry {
  songId: string;
  name: string;
  artist: string | null;
  ministryId: string | null;
  timesPlayed: number;
  lastPlayedDate: string | null;
}

/** Ranking de músicas mais tocadas: conta ocorrências em event_setlists por música da organização. */
export async function fetchSongsRankingAction(orgId: string): Promise<SongRankingEntry[]> {
  const supabase = await createClient();

  const { data: songs, error: songsError } = await supabase
    .from('songs').select('id, name, artist, ministry_id').eq('org_id', orgId);
  if (songsError) throw new Error(songsError.message);
  const songList = (songs ?? []) as { id: string; name: string; artist: string | null; ministry_id: string | null }[];
  if (songList.length === 0) return [];

  const { data: setlistRows, error: setlistError } = await supabase
    .from('event_setlists')
    .select('song_id, event:events(date)')
    .in('song_id', songList.map((s) => s.id));
  if (setlistError) throw new Error(setlistError.message);
  const rows = (setlistRows ?? []) as { song_id: string; event: { date: string } | null }[];

  const statsBySong = new Map<string, { count: number; lastDate: string | null }>();
  for (const row of rows) {
    const entry = statsBySong.get(row.song_id) ?? { count: 0, lastDate: null };
    entry.count += 1;
    if (row.event?.date && (!entry.lastDate || row.event.date > entry.lastDate)) entry.lastDate = row.event.date;
    statsBySong.set(row.song_id, entry);
  }

  return songList
    .map((s) => {
      const stats = statsBySong.get(s.id);
      return {
        songId: s.id, name: s.name, artist: s.artist, ministryId: s.ministry_id,
        timesPlayed: stats?.count ?? 0,
        lastPlayedDate: stats?.lastDate ?? null,
      };
    })
    .filter((s) => s.timesPlayed > 0)
    .sort((a, b) => b.timesPlayed - a.timesPlayed || a.name.localeCompare(b.name));
}

// ── Catálogo global partilhado ─────────────────────────────────────────────
// A lógica de dedup vive em '@/lib/songs-catalog' (partilhada com o importador).

export interface CatalogSuggestion {
  id: string; name: string; artist: string;
  lyrics: string | null; chords: string | null;
  youtube_url: string | null; spotify_url: string | null; bpm: number | null;
}

/** Pesquisa no catálogo GLOBAL por nome ou artista (para reutilizar músicas). */
export async function searchCatalogSongsAction(term: string): Promise<CatalogSuggestion[]> {
  const q = (term ?? '').trim().replace(/[,()]/g, ' ').trim();
  if (q.length < 2) return [];
  const supabase = await createClient();
  const like = `%${q}%`;
  const { data, error } = await supabase.from('catalog_songs')
    .select('id, name, artist, lyrics, chords, youtube_url, spotify_url, bpm')
    .or(`name.ilike.${like},artist.ilike.${like}`)
    .order('name').limit(10);
  if (error) return [];
  return (data ?? []) as CatalogSuggestion[];
}

export async function createSongAction(orgId: string, payload: SongPayload): Promise<Song> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const catalogId = await resolveCatalog(supabase, payload, orgId, user.id);
  const { data, error } = await supabase.from('songs')
    .insert({ ...payload, org_id: orgId, catalog_song_id: catalogId } as never).select().single();
  if (error) throw new Error(error.message);
  return data as Song;
}

export async function updateSongAction(id: string, payload: SongPayload): Promise<Song> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  // Atualiza a cópia da igreja (cada igreja tem a sua versão).
  const { data: updated, error } = await supabase.from('songs')
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  const row = updated as Song;
  // Contribui campos vazios de volta ao catálogo e mantém a ligação certa.
  const catalogId = await resolveCatalog(supabase, payload, row.org_id, user.id);
  if (catalogId && catalogId !== row.catalog_song_id) {
    await supabase.from('songs').update({ catalog_song_id: catalogId }).eq('id', id);
  }
  return { ...row, catalog_song_id: catalogId ?? row.catalog_song_id };
}

export async function deleteSongAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Auto-preenchimento a partir de um link (oEmbed, sem chaves) ─────────────────

/** Limpa o título do YouTube e tenta separar "Artista - Música". */
function parseYoutubeTitle(rawTitle: string, channel?: string): { name: string | null; artist: string | null } {
  let title = (rawTitle ?? '').trim();
  if (!title) return { name: null, artist: null };
  // remover sufixos comuns entre () ou []
  title = title
    .replace(/\s*[([][^)\]]*(official|lyric|áudio|audio|video|vídeo|ao vivo|live|clipe|hd|4k|visualizer|mv)[^)\]]*[)\]]/gi, '')
    .replace(/\s*[|]\s*(official|lyric|audio|video).*$/gi, '')
    .trim();
  // separar "Artista - Música"
  const parts = title.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim() || null, name: parts.slice(1).join(' - ').trim() || null };
  }
  const cleanChannel = (channel ?? '').replace(/\s*-?\s*(topic|vevo|official)$/i, '').trim();
  return { name: title, artist: cleanChannel || null };
}

// ── Pesquisa de músicas gospel (iTunes Search API, sem chave) ──────────────────

export interface SongSuggestion {
  name: string;
  artist: string;
  album: string | null;
  artwork: string | null;
  genre: string;
}

interface ItunesTrack {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
}

// Géneros considerados gospel/louvor (nomes variam entre lojas/idiomas).
const GOSPEL_GENRE = /gospel|worship|christ|crist|louvor|adora|religios|inspira/i;

/** minúsculas, sem acentos e sem sufixos "(...)" / "[...]" — para comparar títulos. */
function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*[([{].*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pontua o quão bem o título corresponde ao que foi escrito (para ordenar). */
function relevanceScore(title: string, query: string): number {
  const t = normalizeTitle(title);
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const words = q.split(/\s+/).filter(Boolean);
  const hits = words.filter((w) => t.includes(w)).length;
  return words.length ? (hits / words.length) * 40 : 0;
}

async function fetchItunes(term: string, country: string): Promise<ItunesTrack[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25&country=${country}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: ItunesTrack[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

/**
 * Pesquisa músicas gospel na iTunes Search API à medida que o utilizador digita.
 * Procura nas lojas BR (português) e US (inglês), filtra por géneros cristãos/gospel,
 * ordena por relevância ao termo e remove duplicados. Sem chave de API.
 */
export async function searchGospelSongsAction(term: string): Promise<SongSuggestion[]> {
  const q = (term ?? '').trim();
  if (q.length < 2) return [];

  const [br, us] = await Promise.all([fetchItunes(q, 'BR'), fetchItunes(q, 'US')]);
  const all = [...br, ...us];

  const seen = new Set<string>();
  const scored: (SongSuggestion & { score: number })[] = [];
  for (const t of all) {
    const genre = t.primaryGenreName ?? '';
    if (!GOSPEL_GENRE.test(genre)) continue;
    const name = t.trackName ?? '';
    const artist = t.artistName ?? '';
    if (!name) continue;
    const key = `${normalizeTitle(name)}|${artist.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    scored.push({
      name,
      artist,
      album: t.collectionName ?? null,
      artwork: t.artworkUrl100 ?? null,
      genre,
      score: relevanceScore(name, q),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((it) => ({
    name: it.name, artist: it.artist, album: it.album, artwork: it.artwork, genre: it.genre,
  }));
}

/**
 * Obtém metadados de uma música a partir de um link do YouTube ou Spotify (via oEmbed).
 * Não precisa de chaves. Devolve o melhor palpite para nome e artista.
 */
export async function fetchSongMetadataAction(url: string): Promise<{
  name: string | null; artist: string | null; provider: 'youtube' | 'spotify' | null;
}> {
  const clean = (url ?? '').trim();
  if (!clean) return { name: null, artist: null, provider: null };

  try {
    if (/(youtube\.com|youtu\.be)/i.test(clean)) {
      const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(clean)}`);
      if (!res.ok) return { name: null, artist: null, provider: 'youtube' };
      const data = (await res.json()) as { title?: string; author_name?: string };
      const parsed = parseYoutubeTitle(data.title ?? '', data.author_name);
      return { ...parsed, provider: 'youtube' };
    }

    if (/spotify\.com/i.test(clean)) {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(clean)}`);
      if (!res.ok) return { name: null, artist: null, provider: 'spotify' };
      const data = (await res.json()) as { title?: string };
      // O oEmbed do Spotify devolve normalmente só o nome da faixa
      return { name: (data.title ?? '').trim() || null, artist: null, provider: 'spotify' };
    }
  } catch {
    return { name: null, artist: null, provider: null };
  }

  return { name: null, artist: null, provider: null };
}
