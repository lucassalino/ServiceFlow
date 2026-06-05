import { useTheme } from '@/hooks/useTheme';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useOrgMemberships } from '@/hooks/useOrganizations';
import { useOrgStore } from '@/stores/orgStore';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';
import type { OrganizationMember } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  leader: 'Líder',
  member: 'Membro',
};

export default function OrgSelectionScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { data: memberships, isLoading } = useOrgMemberships();
  const { setActiveOrg } = useOrgStore();

  function handleSelectOrg(membership: OrganizationMember) {
    if (!membership.organization) return;
    setActiveOrg(membership.organization, membership);
    router.push(`/(org)/${membership.org_id}/dashboard`);
  }

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={Colors.gray400} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>As tuas organizações</Text>
        <Text style={s.subtitle}>Seleciona para continuar</Text>
      </View>

      <FlatList
        data={memberships ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<EmptyState scheme={scheme} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => handleSelectOrg(item)}>
            <View style={s.cardAvatar}>
              <Text style={s.cardAvatarText}>
                {item.organization?.name.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{item.organization?.name ?? '—'}</Text>
              <Text style={s.cardRole}>{ROLE_LABELS[item.role] ?? item.role}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={s.joinButton}
        onPress={() => router.push('/(home)/join-org')}
      >
        <Text style={s.joinButtonText}>+ Entrar ou criar organização</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ scheme }: { scheme: 'light' | 'dark' }) {
  const s = styles(scheme);
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>Ainda não pertences a nenhuma organização.</Text>
    </View>
  );
}

const styles = (scheme: 'light' | 'dark') => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background[scheme] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background[scheme] },
  header: { paddingHorizontal: Spacing[6], paddingTop: 64, paddingBottom: Spacing[6] },
  title: { fontFamily: Typography.fonts.bold, fontSize: Typography.sizes.xl, color: Colors.text.primary[scheme] },
  subtitle: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme], marginTop: Spacing[1] },
  list: { paddingHorizontal: Spacing[6], gap: Spacing[3] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    backgroundColor: Colors.surface[scheme],
    borderRadius: Radii.md,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.border[scheme],
    gap: Spacing[3],
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceSecondary[scheme],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: { fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.md, color: Colors.text.primary[scheme] },
  cardBody: { flex: 1 },
  cardName: { fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.base, color: Colors.text.primary[scheme] },
  cardRole: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme], marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.gray300 },
  joinButton: {
    margin: Spacing[6],
    height: 48,
    borderRadius: Radii.md,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.border[scheme],
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: { fontFamily: Typography.fonts.medium, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme] },
  empty: { paddingVertical: Spacing[10], alignItems: 'center' },
  emptyText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.tertiary[scheme], textAlign: 'center' },
});
