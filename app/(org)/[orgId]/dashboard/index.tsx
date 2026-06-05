import { useTheme } from '@/hooks/useTheme';
import { View, Text, StyleSheet,  ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useOrgStore } from '@/stores/orgStore';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';

export default function DashboardScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { activeOrg, activeMembership } = useOrgStore();
  const { profile } = useAuthStore();

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    leader: 'Líder',
    member: 'Membro',
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/(home)')}>
          <Text style={s.orgSwitchText}>← Organizações</Text>
        </TouchableOpacity>
        <View style={s.orgInfo}>
          <View style={s.orgAvatar}>
            <Text style={s.orgAvatarText}>
              {activeOrg?.name.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={s.orgName}>{activeOrg?.name ?? '—'}</Text>
            <Text style={s.orgRole}>{ROLE_LABELS[activeMembership?.role ?? ''] ?? '—'}</Text>
          </View>
        </View>
        <Text style={s.greeting}>
          Olá, {profile?.full_name?.split(' ')[0] ?? 'utilizador'} 👋
        </Text>
      </View>

      {/* Placeholder sections — will be filled in next steps */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Próximos eventos</Text>
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>Nenhum evento agendado</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>As tuas escalas</Text>
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>Não estás escalado para nenhum evento</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (scheme: 'light' | 'dark') => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background[scheme] },
  content: { paddingBottom: Spacing[8] },
  header: { paddingHorizontal: Spacing[6], paddingTop: 60, paddingBottom: Spacing[6] },
  orgSwitchText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme], marginBottom: Spacing[4] },
  orgInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[4] },
  orgAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceSecondary[scheme],
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgAvatarText: { fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.base, color: Colors.text.primary[scheme] },
  orgName: { fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.base, color: Colors.text.primary[scheme] },
  orgRole: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.xs, color: Colors.text.secondary[scheme] },
  greeting: { fontFamily: Typography.fonts.bold, fontSize: Typography.sizes.xl, color: Colors.text.primary[scheme] },
  section: { paddingHorizontal: Spacing[6], marginTop: Spacing[6] },
  sectionTitle: { fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.base, color: Colors.text.primary[scheme], marginBottom: Spacing[3] },
  emptyCard: {
    padding: Spacing[5],
    backgroundColor: Colors.surface[scheme],
    borderRadius: Radii.md,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.border[scheme],
    alignItems: 'center',
  },
  emptyText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.tertiary[scheme] },
});
