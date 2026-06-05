import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ name, avatarUrl, size = 40 }: Props) {
  const scheme = useTheme();
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const fontSize = size * 0.38;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.surfaceSecondary[scheme],
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: Colors.text.secondary[scheme] }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
  initials: { fontFamily: Typography.fonts.semiBold },
});
