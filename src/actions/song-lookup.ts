'use server';

/**
 * Sugestões externas para o formulário de música, via API pública do Deezer
 * (sem chave/registo necessário). Só em complemento ao catálogo interno —
 * dá nome/artista/capa na busca e, ao selecionar, BPM e duração (o Deezer
 * não tem tom/referência bíblica/cifra — isso continua manual).
 */

export interface ExternalSongSuggestion {
  id: string;
  name: string;
  artist: string;
  coverUrl: string | null;
}

export interface ExternalSongDetails {
  bpm: number | null;
  duration: string | null;
}

function formatDuration(totalSeconds: number | null | undefined): string | null {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export async function searchExternalSongsAction(term: string): Promise<ExternalSongSuggestion[]> {
  const q = (term ?? '').trim();
  if (q.length < 2) return [];

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=6`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const json = await res.json() as {
      data?: { id: number; title: string; artist?: { name?: string }; album?: { cover_medium?: string } }[];
    };
    return (json.data ?? []).map((t) => ({
      id: String(t.id),
      name: t.title,
      artist: t.artist?.name ?? '',
      coverUrl: t.album?.cover_medium ?? null,
    }));
  } catch {
    // API externa indisponível/lenta — falha em silêncio, o catálogo interno já chega.
    return [];
  }
}

export async function fetchExternalSongDetailsAction(trackId: string): Promise<ExternalSongDetails> {
  try {
    const res = await fetch(`https://api.deezer.com/track/${encodeURIComponent(trackId)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { bpm: null, duration: null };
    const json = await res.json() as { bpm?: number; duration?: number };
    const bpm = json.bpm && json.bpm > 0 ? Math.round(json.bpm) : null;
    return { bpm, duration: formatDuration(json.duration) };
  } catch {
    return { bpm: null, duration: null };
  }
}
