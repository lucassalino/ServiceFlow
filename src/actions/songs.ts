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
  bpm: number | null; lyrics: string | null; chords: string | null;
  youtube_url: string | null; spotify_url: string | null; ministry_id: string | null;
}

export async function fetchSongsAction(orgId: string): Promise<Song[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('songs')
    .select('*').eq('org_id', orgId).order('name');
  if (error) throw new Error(error.message);
  return data as Song[];
}

// ── Catálogo global partilhado ─────────────────────────────────────────────

type AdminClient = ReturnType<typeof getAdmin>;

/** Campos partilhados no catálogo global (o Tom NÃO é partilhado). */
const SHARED_KEYS = ['lyrics', 'chords', 'youtube_url', 'spotify_url', 'bpm'] as const;

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
async function resolveCatalog(
  admin: AdminClient, payload: SongPayload, orgId: string, userId: string,
): Promise<string | null> {
  const name = payload.name.trim();
  const artist = (payload.artist ?? '').trim();
  if (!name) return null;
  const esc = (s: string) => s.replace(/[%_]/g, '\\$&');

  const { data: found } = await admin.from('catalog_songs').select('*')
    .ilike('name', esc(name)).ilike('artist', esc(artist)).limit(1).maybeSingle();
  const cat = found as Record<string, unknown> | null;

  if (cat) {
    const patch: Record<string, unknown> = {};
    for (const k of SHARED_KEYS) {
      if (isEmpty(cat[k]) && !isEmpty(payload[k])) patch[k] = payload[k];
    }
    if (Object.keys(patch).length > 0) {
      patch.updated_at = new Date().toISOString();
      await admin.from('catalog_songs').update(patch as never).eq('id', cat.id as string);
    }
    return cat.id as string;
  }

  const { data: created, error } = await admin.from('catalog_songs').insert({
    name, artist,
    lyrics: payload.lyrics, chords: payload.chords,
    youtube_url: payload.youtube_url, spotify_url: payload.spotify_url,
    bpm: payload.bpm, source_org_id: orgId, created_by: userId,
  }).select('id').single();

  if (error) {
    // corrida: outra igreja criou a mesma entrada — procurar de novo
    const { data: retry } = await admin.from('catalog_songs').select('id')
      .ilike('name', esc(name)).ilike('artist', esc(artist)).limit(1).maybeSingle();
    return (retry as { id: string } | null)?.id ?? null;
  }
  return (created as { id: string }).id;
}

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
  const admin = getAdmin();
  const catalogId = await resolveCatalog(admin, payload, orgId, user.id);
  const { data, error } = await admin.from('songs')
    .insert({ ...payload, org_id: orgId, catalog_song_id: catalogId }).select().single();
  if (error) throw new Error(error.message);
  return data as Song;
}

export async function updateSongAction(id: string, payload: SongPayload): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  // Atualiza a cópia da igreja (cada igreja tem a sua versão).
  const { data: updated, error } = await admin.from('songs')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id).select('org_id').single();
  if (error) throw new Error(error.message);
  // Contribui campos vazios de volta ao catálogo e mantém a ligação certa.
  const orgId = (updated as { org_id: string }).org_id;
  const catalogId = await resolveCatalog(admin, payload, orgId, user.id);
  if (catalogId) await admin.from('songs').update({ catalog_song_id: catalogId }).eq('id', id);
}

export async function deleteSongAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('songs').delete().eq('id', id);
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
