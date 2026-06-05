import { View, Text, useColorScheme } from 'react-native';
import { Colors, Typography } from '@/constants';

export default function PlaceholderScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background[scheme], justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.base, color: Colors.text.secondary[scheme] }}>
        Em construção
      </Text>
    </View>
  );
}
