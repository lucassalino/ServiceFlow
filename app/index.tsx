import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const { session, isLoading } = useAuthStore();
  const scheme = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background[scheme] }}>
        <ActivityIndicator color={Colors.gray400} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(home)" />;
}
