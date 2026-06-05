import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useOrgMembers, useUpdateMemberRole, useToggleMemberActive } from '@/hooks/useMembers';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgStore } from '@/stores/orgStore';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';

const ROLE_OPTIONS = [
  { key: 'admin', label: 'Administrador' },
  { key: 'leader', label: 'Líder' },
  { key: 'member', label: 'Membro' },
] as const;

export default function MemberDetailScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { userId } = useLocalSearchParams<{ userId: string; orgId: string }>();
  const { activeMembership } = useOrgStore();
  const { user } = useAuthStore();
  const { data: members, isLoading } = useOrgMembers();
  const { data: ministries } = useMinistries();
  const { mutate: updateRole, isPending: updatingRole } = useUpdateMemberRole();
  const { mutate: toggleActive, isPending: togglingActive } = useToggleMemberActive();

  const isAdmin = activeMembership?.role === 'admin';
  const isSelf = user?.id === userId;

  const membership = members?.find((m) => m.user_id === userId);
  const profile = membership?.profile;

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.gray400} />
      </View>
    );
  }

  if (!membership || !profile) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.text.secondary[scheme] }}>Membro não encontrado.</Text>
      </View>
    );
  }

  const name = profile.full_name || profile.email;

  // membership is guaranteed non-null here (early returns above handle the null case)
  const m = membership;

  function handleRoleChange() {
    if (!isAdmin || isSelf || !m) return;
    Alert.alert(
      'Alterar papel',
      'Seleciona o novo papel deste membro:',
      ROLE_OPTIONS.map((opt) => ({
        text: opt.label,
        onPress: () => updateRole({ memberId: m.id, role: opt.key }),
        style: m.role === opt.key ? 'cancel' : 'default',
      })),
    );
  }

  function handleToggleActive() {
    if (!isAdmin || isSelf || !m) return;
    const next = !m.is_active;
    Alert.alert(
      next ? 'Ativar membro' : 'Desativar membro',
      next
        ? `${name} voltará a ter acesso à organização.`
        : `${name} perderá acesso à organização. Podes reativar a qualquer momento.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: next ? 'Ativar' : 'Desativar',
          style: next ? 'default' : 'destructive',
          onPress: () => toggleActive({ memberId: m.id, isActive: next }),
        },
      ],
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Pessoas</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={s.hero}>
        <Avatar name={name} avatarUrl={profile.avatar_url} size={72} />
        <Text style={s.heroName}>{name}</Text>
        {profile.email && <Text style={s.heroEmail}>{profile.email}</Text>}
        {profile.phone && <Text style={s.heroPhone}>{profile.phone}</Text>}
        {!m.is_active && (
          <View style={s.inactiveBadge}>
            <Text style={s.inactiveBadgeText}>Inativo</Text>
          </View>
        )}
      </View>

      {/* Papel */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Papel na organização</Text>
        <TouchableOpacity
          style={s.row}
          onPress={handleRoleChange}
          disabled={!isAdmin || isSelf || updatingRole}
        >
          <Text style={s.rowLabel}>Papel</Text>
          <View style={s.rowRight}>
            <Text style={s.rowValue}>
              {ROLE_OPTIONS.find((r) => r.key === m.role)?.label ?? m.role}
            </Text>
            {isAdmin && !isSelf && <Text style={s.rowChevron}>›</Text>}
          </View>
        </TouchableOpacity>
      </View>

      {/* Ministérios */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Ministérios</Text>
        {(ministries ?? []).length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>Nenhum ministério criado.</Text>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.emptyText}>
              A gestão de funções por ministério é feita no ecrã de cada ministério.
            </Text>
          </View>
        )}
      </View>

      {/* Ações de admin */}
      {isAdmin && !isSelf && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ações</Text>
          <TouchableOpacity
            style={[s.actionRow, m.is_active ? s.actionDanger : s.actionNormal]}
            onPress={handleToggleActive}
            disabled={togglingActive}
          >
            {togglingActive ? (
              <ActivityIndicator color={Colors.gray400} />
            ) : (
              <Text style={m.is_active ? s.actionDangerText : s.actionNormalText}>
                {m.is_active ? 'Desativar membro' : 'Reativar membro'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background[scheme] },
    content: { paddingBottom: Spacing[10] },
    backBtn: {
      paddingHorizontal: Spacing[6],
      paddingTop: 60,
      paddingBottom: Spacing[4],
    },
    backText: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: Spacing[6],
      paddingBottom: Spacing[6],
      gap: Spacing[2],
    },
    heroName: {
      fontFamily: Typography.fonts.bold,
      fontSize: Typography.sizes.xl,
      color: Colors.text.primary[scheme],
      marginTop: Spacing[2],
      textAlign: 'center',
    },
    heroEmail: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
    },
    heroPhone: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
    },
    inactiveBadge: {
      marginTop: Spacing[1],
      paddingHorizontal: Spacing[3],
      paddingVertical: 3,
      borderRadius: Radii.full,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
    },
    inactiveBadgeText: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.xs,
      color: Colors.text.tertiary[scheme],
    },
    section: {
      paddingHorizontal: Spacing[6],
      marginBottom: Spacing[5],
      gap: Spacing[2],
    },
    sectionTitle: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.xs,
      color: Colors.text.tertiary[scheme],
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    card: {
      backgroundColor: Colors.surface[scheme],
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      padding: Spacing[4],
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: Colors.surface[scheme],
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
    },
    rowLabel: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary[scheme],
    },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    rowValue: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.base,
      color: Colors.text.secondary[scheme],
    },
    rowChevron: { fontSize: 20, color: Colors.gray300 },
    emptyCard: {
      backgroundColor: Colors.surface[scheme],
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      padding: Spacing[4],
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
      textAlign: 'center',
    },
    actionRow: {
      height: 48,
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionDanger: {
      borderColor: Colors.error,
    },
    actionNormal: {
      borderColor: Colors.border[scheme],
    },
    actionDangerText: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.base,
      color: Colors.error,
    },
    actionNormalText: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.base,
      color: Colors.text.secondary[scheme],
    },
  });
