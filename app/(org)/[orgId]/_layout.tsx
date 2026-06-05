import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';

import { Colors, Typography } from '@/constants';

export default function OrgLayout() {
  const scheme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface[scheme],
          borderTopWidth: 0.5,
          borderTopColor: Colors.border[scheme],
          elevation: 0,
          shadowOpacity: 0,
          height: 56,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.fonts.medium,
          fontSize: 11,
        },
        tabBarActiveTintColor: Colors.text.primary[scheme],
        tabBarInactiveTintColor: Colors.text.tertiary[scheme],
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{ title: 'Início', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="events/index"
        options={{ title: 'Eventos', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="ministries/index"
        options={{ title: 'Ministérios', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="members/index"
        options={{ title: 'Pessoas', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{ title: 'Definições', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}
