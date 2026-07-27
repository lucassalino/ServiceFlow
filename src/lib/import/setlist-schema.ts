// Esquema e heurísticas do importador de setlists (CSV).
// Reconcilia os cabeçalhos do CSV com as colunas reais da tabela `songs`.
import { SONG_KEYS } from '@/lib/constants';

/** Campo-alvo para onde uma coluna do CSV pode ser mapeada. */
export interface TargetField {
  key: 'name' | 'artist' | 'musical_key' | 'bpm' | 'youtube_url';
  label: string;
  required: boolean;
  /** Aliases de cabeçalho (normalizados) para auto-mapeamento. */
  aliases: string[];
}

export const TARGET_FIELDS: TargetField[] = [
  { key: 'name', label: 'Nome da música', required: true,
    aliases: ['nome', 'musica', 'música', 'song', 'title', 'titulo', 'título', 'name', 'cancao', 'canção'] },
  { key: 'artist', label: 'Artista', required: false,
    aliases: ['artista', 'artist', 'autor', 'interprete', 'intérprete', 'banda', 'cantor'] },
  { key: 'musical_key', label: 'Tom', required: false,
    aliases: ['tom', 'key', 'tonalidade', 'nota'] },
  { key: 'bpm', label: 'BPM', required: false,
    aliases: ['bpm', 'andamento', 'tempo'] },
  { key: 'youtube_url', label: 'YouTube', required: false,
    aliases: ['youtube', 'yt', 'link', 'video', 'vídeo', 'url'] },
];

/** Linha crua vinda do CSV: cabeçalho -> valor. */
export type RawRow = Record<string, string>;

/** Mapeamento coluna-alvo -> cabeçalho do CSV (ou null se não mapeado). */
export type ColumnMapping = Record<TargetField['key'], string | null>;

/** Música derivada de uma linha do CSV, pronta para procurar/criar. */
export interface SongDraft {
  name: string;
  artist: string | null;
  musical_key: string | null;
  bpm: number | null;
  youtube_url: string | null;
}

/** Normaliza um texto para comparação (sem acentos, minúsculas, sem espaços/pontuação). */
export function normalizeHeader(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/** Auto-mapeia os cabeçalhos do CSV para os campos-alvo pelos aliases. */
export function autoMap(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    name: null, artist: null, musical_key: null, bpm: null, youtube_url: null,
  };
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  for (const field of TARGET_FIELDS) {
    const aliasSet = new Set(field.aliases.map(normalizeHeader));
    // 1º: correspondência exata; 2º: cabeçalho que contém/está contido no alias.
    const exact = normalizedHeaders.find((h) => aliasSet.has(h.norm) && !isTaken(mapping, h.raw));
    const partial = exact ?? normalizedHeaders.find((h) =>
      !isTaken(mapping, h.raw) &&
      [...aliasSet].some((a) => a.length >= 2 && (h.norm.includes(a) || a.includes(h.norm))),
    );
    if (partial) mapping[field.key] = partial.raw;
  }
  return mapping;
}

function isTaken(mapping: ColumnMapping, header: string): boolean {
  return Object.values(mapping).includes(header);
}

/** Normaliza um valor de tom para o formato usado na app (ex.: "sol" -> "G", "c#" -> "C#"). */
export function normalizeMusicalKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  // Se já é um tom válido (com correção de maiúsculas/símbolos), usa-o.
  const direct = raw.replace(/\s+/g, '');
  const foundDirect = SONG_KEYS.find((k) => normalizeHeader(k) === normalizeHeader(direct));
  if (foundDirect) return foundDirect;

  // Nomes em português (dó, ré, mi, fá, sol, lá, si) -> notação anglo-saxónica.
  const ptToLetter: Record<string, string> = {
    do: 'C', c: 'C', re: 'D', d: 'D', mi: 'E', e: 'E',
    fa: 'F', f: 'F', sol: 'G', g: 'G', la: 'A', a: 'A', si: 'B', b: 'B',
  };
  const m = direct.match(/^([a-zA-Zàáâãéêíóôõúç]+)([#b♯♭]?)(m|min|menor)?$/i);
  if (m) {
    const base = ptToLetter[normalizeHeader(m[1])];
    if (base) {
      const accidental = m[2] === '♯' ? '#' : m[2] === '♭' ? 'b' : m[2] || '';
      const minor = m[3] ? 'm' : '';
      const candidate = `${base}${accidental}${minor}`;
      const found = SONG_KEYS.find((k) => normalizeHeader(k) === normalizeHeader(candidate));
      if (found) return found;
      return candidate; // devolve mesmo que não esteja na lista fechada
    }
  }
  return raw; // último recurso: mantém o valor original
}

/** Converte uma linha crua num rascunho de música, aplicando o mapeamento. */
export function rowToDraft(row: RawRow, mapping: ColumnMapping): SongDraft | null {
  const get = (key: TargetField['key']): string => {
    const header = mapping[key];
    return header ? (row[header] ?? '').trim() : '';
  };
  const name = get('name');
  if (!name) return null; // linha sem nome é ignorada

  const bpmRaw = get('bpm').replace(/[^0-9]/g, '');
  const bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;

  return {
    name,
    artist: get('artist') || null,
    musical_key: normalizeMusicalKey(get('musical_key')),
    bpm: Number.isFinite(bpm) && bpm ? bpm : null,
    youtube_url: get('youtube_url') || null,
  };
}

/** Valida se o mapeamento tem, no mínimo, o campo obrigatório (nome). */
export function isMappingValid(mapping: ColumnMapping): boolean {
  return TARGET_FIELDS.filter((f) => f.required).every((f) => !!mapping[f.key]);
}
