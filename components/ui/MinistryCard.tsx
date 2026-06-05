import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';
import { MINISTRY_ICON_EMOJI } from '@/constants/ministries';
import { useTheme } from '@/hooks/useTheme';
import type { Ministry } from '@/types';

interface Props {
  ministry: Ministry;
  onPress: () => void;
  onLongPress?: () => void;
}

export function MinistryCard({ ministry, onPress, onLongPress }: Props) {
  const scheme = useTheme();
  const s = styles(scheme);
  const emoji = MINISTRY_ICON_EMOJI[ministry.icon] ?? '⭐';

  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Color accent bar */}
      <View style={[s.accent, { backgroundColor: ministry.color }]} />

      <View style={s.iconWrapper}>
        <Text style={s.emoji}>{emoji}</Text>
      </View>

      <View style={s.body}>
        <Text style={s.name}>{ministry.name}</Text>
      </View>

      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = (scheme: 'light' | 'dark') => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface[scheme],
    borderRadius: Radii.md,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.border[scheme],
    overflow: 'hidden',
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
  },
  iconWrapper: {
    width: 44,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  body: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingRight: Spacing[3],
  },
  name: {
    fontFamily: Typography.fonts.semiBold,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary[scheme],
  },
  chevron: {
    fontSize: 22,
    color: Colors.gray300,
    paddingRight: Spacing[4],
  },
});
