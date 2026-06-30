export const SUBSCRIPTION_PLANS = {
  free:       { label: 'Gratuito',   memberLimit: 7,  priceMonthly: 0 },
  starter:    { label: 'Starter',    memberLimit: 15, priceMonthly: 2.99 },
  growth:     { label: 'Growth',     memberLimit: 25, priceMonthly: 5.99 },
  pro:        { label: 'Pro',        memberLimit: 35, priceMonthly: 8.99 },
  enterprise: { label: 'Enterprise', memberLimit: 50, priceMonthly: 15.0 },
} as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', leader: 'Líder', member: 'Membro',
};

export const MINISTRY_ICON_EMOJI: Record<string, string> = {
  'music-note': '🎵', 'heart': '❤️', 'book': '📖', 'mic': '🎤',
  'camera': '📷', 'speaker': '🔊', 'cross': '✝️', 'star': '⭐',
  'hands': '🙏', 'gift': '🎁',
};

export const MINISTRY_ICONS = Object.entries(MINISTRY_ICON_EMOJI).map(([key, emoji]) => ({ key, emoji }));

export const MINISTRY_COLORS = [
  '#3A3A38', '#4A5A6A', '#4A6A5A', '#6A4A5A',
  '#6A5A4A', '#5A4A6A', '#4A6A6A', '#6A6A4A',
] as const;

export const MEMBER_FUNCTIONS = [
  // Liderança / Coordenação
  { key: 'coordination',    label: 'Coordenação',      emoji: '🎯' },
  // Louvor - Vocal
  { key: 'worship_leader',  label: 'Ministro (Vocal)', emoji: '🙌' },
  { key: 'back_vocal',      label: 'Backvocal',        emoji: '🎙️' },
  // Louvor - Instrumentos
  { key: 'drummer',         label: 'Bateria',          emoji: '🥁' },
  { key: 'bass',            label: 'Baixo',            emoji: '🎸' },
  { key: 'acoustic',        label: 'Violão',           emoji: '🪕' },
  { key: 'keys',            label: 'Teclado/Piano',    emoji: '🎹' },
  { key: 'guitarist',       label: 'Guitarra',         emoji: '🎸' },
  { key: 'percussion',      label: 'Percussão',        emoji: '🪘' },
  { key: 'violin',          label: 'Violino',          emoji: '🎻' },
  { key: 'trumpet',         label: 'Trompete',         emoji: '🎺' },
  { key: 'flute',           label: 'Flauta',           emoji: '🪈' },
  // Técnica
  { key: 'sound_operator',  label: 'Mesa de som',      emoji: '🎚️' },
  { key: 'media',           label: 'Mídia',            emoji: '💻' },
  { key: 'live_stream',     label: 'Transmissão',      emoji: '📡' },
  { key: 'camera_operator', label: 'Câmera',           emoji: '📹' },
  { key: 'projection',      label: 'Projeção/Slides',  emoji: '🖥️' },
  { key: 'photography',     label: 'Fotografia',       emoji: '📷' },
  { key: 'lighting',        label: 'Iluminação',       emoji: '💡' },
  // Ensino / Palavra
  { key: 'preacher',        label: 'Pregador',         emoji: '📢' },
  { key: 'teacher',         label: 'Professor',        emoji: '📚' },
  // Oração
  { key: 'intercessor',     label: 'Intercessor',      emoji: '🙏' },
  { key: 'vigil_leader',    label: 'Líder de vigília', emoji: '🌙' },
  // Artes / expressão
  { key: 'dance',           label: 'Dança',            emoji: '💃' },
  { key: 'drama',           label: 'Teatro',           emoji: '🎭' },
  // Suporte
  { key: 'reception',       label: 'Recepção',         emoji: '👋' },
  { key: 'kitchen',         label: 'Cozinha',          emoji: '🍳' },
  { key: 'decoration',      label: 'Decoração',        emoji: '🎨' },
  { key: 'security',        label: 'Segurança',        emoji: '🔐' },
  { key: 'auxiliary',       label: 'Auxiliar',         emoji: '🤝' },
] as const;

export function getFunctionLabel(key: string): string {
  return MEMBER_FUNCTIONS.find((f) => f.key === key)?.label ?? key;
}

export function getFunctionEmoji(key: string): string {
  return MEMBER_FUNCTIONS.find((f) => f.key === key)?.emoji ?? '•';
}

export const PRESET_MINISTRIES = [
  {
    name: 'Louvor',
    icon: '🎵',
    color: '#4A5A6A',
    functions: ['coordination', 'worship_leader', 'back_vocal', 'drummer', 'bass', 'acoustic', 'keys', 'guitarist', 'percussion', 'sound_operator', 'media', 'live_stream'],
  },
  {
    name: 'Infantil',
    icon: '🎁',
    color: '#4A6A6A',
    functions: ['teacher', 'auxiliary'],
  },
  {
    name: 'Oração',
    icon: '🙏',
    color: '#6A5A4A',
    functions: ['intercessor', 'vigil_leader'],
  },
] as const;

export const SONG_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
];
