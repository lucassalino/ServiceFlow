export const MINISTRY_ICONS = [
  { key: 'music-note', label: 'Louvor' },
  { key: 'heart', label: 'Infantil' },
  { key: 'hand-raised', label: 'Intercessão' },
  { key: 'video-camera', label: 'Mídia' },
  { key: 'user-group', label: 'Recepção' },
  { key: 'academic-cap', label: 'Escola' },
  { key: 'megaphone', label: 'Comunicação' },
  { key: 'building-library', label: 'Jovens' },
  { key: 'sun', label: 'Crianças' },
  { key: 'sparkles', label: 'Outro' },
] as const;

export type MinistryIconKey = (typeof MINISTRY_ICONS)[number]['key'];

// Accent colors for ministries — muted tones within the design system
export const MINISTRY_COLORS = [
  '#3A3A38', // graphite (default)
  '#4A5A6A', // slate blue
  '#4A6A5A', // forest green
  '#6A4A5A', // mauve
  '#6A5A4A', // warm brown
  '#5A4A6A', // purple
  '#4A6A6A', // teal
  '#6A6A4A', // olive
] as const;

export type MinistryColor = (typeof MINISTRY_COLORS)[number];

// Map icon key → unicode emoji for display without icon library dependency
export const MINISTRY_ICON_EMOJI: Record<string, string> = {
  'music-note': '🎵',
  'heart': '❤️',
  'hand-raised': '🙌',
  'video-camera': '🎥',
  'user-group': '👋',
  'academic-cap': '📖',
  'megaphone': '📣',
  'building-library': '✨',
  'sun': '☀️',
  'sparkles': '⭐',
};
