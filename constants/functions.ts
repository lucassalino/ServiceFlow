export const MEMBER_FUNCTIONS = [
  { key: 'vocalist', label: 'Vocalista', emoji: '🎤' },
  { key: 'back_vocal', label: 'Back Vocal', emoji: '🎵' },
  { key: 'guitarist', label: 'Guitarrista', emoji: '🎸' },
  { key: 'bass', label: 'Baixista', emoji: '🎸' },
  { key: 'drummer', label: 'Baterista', emoji: '🥁' },
  { key: 'keys', label: 'Teclista', emoji: '🎹' },
  { key: 'acoustic', label: 'Violão', emoji: '🎻' },
  { key: 'sound_operator', label: 'Op. de Som', emoji: '🎚️' },
  { key: 'camera_operator', label: 'Op. de Câmera', emoji: '📷' },
  { key: 'media', label: 'Mídia', emoji: '💻' },
  { key: 'reception', label: 'Recepção', emoji: '🤝' },
  { key: 'teacher', label: 'Professor', emoji: '📖' },
  { key: 'auxiliary', label: 'Auxiliar', emoji: '🙋' },
] as const;

export type FunctionKey = (typeof MEMBER_FUNCTIONS)[number]['key'];

export function getFunctionLabel(key: string): string {
  return MEMBER_FUNCTIONS.find((f) => f.key === key)?.label ?? key;
}

export function getFunctionEmoji(key: string): string {
  return MEMBER_FUNCTIONS.find((f) => f.key === key)?.emoji ?? '•';
}
