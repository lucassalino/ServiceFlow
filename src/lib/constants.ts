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
  { key: 'vocalist',        label: 'Vocal',        emoji: '🎤' },
  { key: 'back_vocal',      label: 'Back Vocal',   emoji: '🎙️' },
  { key: 'guitarist',       label: 'Guitarra',     emoji: '🎸' },
  { key: 'bass',            label: 'Baixo',        emoji: '🎸' },
  { key: 'drummer',         label: 'Bateria',      emoji: '🥁' },
  { key: 'keys',            label: 'Teclado',      emoji: '🎹' },
  { key: 'acoustic',        label: 'Acústica',     emoji: '🪕' },
  { key: 'sound_operator',  label: 'Som',          emoji: '🎚️' },
  { key: 'camera_operator', label: 'Câmera',       emoji: '📹' },
  { key: 'media',           label: 'Multimédia',   emoji: '💻' },
  { key: 'reception',       label: 'Recepção',     emoji: '👋' },
  { key: 'teacher',         label: 'Professor',    emoji: '📚' },
  { key: 'auxiliary',       label: 'Auxiliar',     emoji: '🤝' },
] as const;

export function getFunctionLabel(key: string): string {
  return MEMBER_FUNCTIONS.find((f) => f.key === key)?.label ?? key;
}

export function getFunctionEmoji(key: string): string {
  return MEMBER_FUNCTIONS.find((f) => f.key === key)?.emoji ?? '•';
}

export const SONG_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
];
