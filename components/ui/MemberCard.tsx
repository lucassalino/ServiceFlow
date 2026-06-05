import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from './Avatar';
import type { OrganizationMember } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  leader: 'Líder',
  member: 'Membro',
};

const ROLE_BADGE_COLOR = {
  admin: '#4A5A6A',
  leader: '#4A6A5A',
  member: 'transparent',
};

interface Props {
  member: OrganizationMember;
  onPress: () => void;
}

export function MemberCard({ member, onPress }: Props) {
  const scheme = useTheme();
  const s = styles(scheme);
  const profile = member.profile;
  const name = profile?.full_name || profile?.email || '—';
  const isAdmin = member.role === 'admin';
  const isLeader = member.role === 'leader';
  const showBadge = isAdmin || isLeader;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <Avatar name={name} avatarUrl={profile?.avatar_url} size={44} />

      <View style={s.body}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
          {showBadge && (
            <View style={[s.badge, { backgroundColor: ROLE_BADGE_COLOR[member.role] }]}>
              <Text style={s.badgeText}>{ROLE_LABELS[member.role]}</Text>
            </View>
          )}
        </View>
        <Text style={s.email} numberOfLines={1}>{profile?.email ?? '—'}</Text>
      </View>

      {!member.is_active && (
        <View style={s.inactivePill}>
          <Text style={s.inactivePillText}>Inativo</Text>
        </View>
      )}

      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[3],
      padding: Spacing[4],
      backgroundColor: Colors.surface[scheme],
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
    },
    body: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    name: {
      fontFamily: Typography.fonts.semiBold,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary[scheme],
      flexShrink: 1,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.full,
    },
    badgeText: {
      fontFamily: Typography.fonts.medium,
      fontSize: 10,
      color: Colors.gray50,
    },
    email: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
    },
    inactivePill: {
      paddingHorizontal: Spacing[2],
      paddingVertical: 2,
      borderRadius: Radii.full,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
    },
    inactivePillText: {
      fontFamily: Typography.fonts.regular,
      fontSize: 10,
      color: Colors.text.tertiary[scheme],
    },
    chevron: { fontSize: 22, color: Colors.gray300 },
  });
