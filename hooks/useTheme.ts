import { useColorScheme } from 'react-native';
import type { ColorScheme } from '@/constants';

// Normalises 'unspecified' (returned on some platforms) to 'light'
export function useTheme(): ColorScheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
