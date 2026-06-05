import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgStore } from '@/stores/orgStore';
import { MINISTRY_ICON_EMOJI } from '@/constants/ministries';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';

export default function MinistryDetailScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { ministryId, orgId } = useLocalSearchParams<{ ministryId: string; orgId: string }>();
  const { activeMembership } = useOrgStore();
  const { data: ministries, isLoading } = useMinistries();

  const ministry = ministries?.find((m) => m.id === ministryId);
  const canWrite = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.gray400} />
      </View>
    );
  }

  if (!ministry) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={s.emptyText}>Ministério não encontrado.</Text>
      </View>
    );
  }

  const emoji = MINISTRY_ICON_EMOJI[ministry.icon] ?? '⭐';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Ministérios</Text>
        </TouchableOpacity>

        <View style={s.heroRow}>
          <View style={[s.accentBar, { backgroundColor: ministry.color }]} />
          <Text style={s.heroEmoji}>{emoji}</Text>
          <View style={s.heroText}>
            <Text style={s.heroName}>{ministry.name}</Text>
          </View>
          {canWrite && (
            <TouchableOpacity
              style={s.editButton}
              onPress={() => router.push(`/(org)/${orgId}/ministries/${ministryId}/edit`)}
            >
              <Text style={s.editButtonText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Membros — placeholder para a Etapa 4 */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Membros</Text>
          {canWrite && (
            <TouchableOpacity>
              <Text style={s.sectionAction}>+ Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>Ainda não há membros neste ministério.</Text>
          <Text style={s.emptySubtext}>
            Os membros serão geridos na secção Pessoas.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background[scheme] },
    content: { paddingBottom: Spacing[8] },
    header: {
      paddingHorizontal: Spacing[6],
      paddingTop: 60,
      paddingBottom: Spacing[5],
    },
    backText: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
      marginBottom: Spacing[5],
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[3],
      backgroundColor: Colors.surface[scheme],
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      overflow: 'hidden',
      padding: Spacing[4],
      paddingLeft: 0,
    },
    accentBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
    heroEmoji: { fontSize: 28, paddingLeft: Spacing[3] },
    heroText: { flex: 1 },
    heroName: {
      fontFamily: Typography.fonts.bold,
      fontSize: Typography.sizes.lg,
      color: Colors.text.primary[scheme],
    },
    editButton: {
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[1],
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      borderRadius: Radii.full,
      marginRight: Spacing[1],
    },
    editButtonText: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.xs,
      color: Colors.text.secondary[scheme],
    },
    section: { paddingHorizontal: Spacing[6], marginTop: Spacing[5] },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing[3],
    },
    sectionTitle: {
      fontFamily: Typography.fonts.semiBold,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary[scheme],
    },
    sectionAction: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
    },
    emptyCard: {
      padding: Spacing[5],
      backgroundColor: Colors.surface[scheme],
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      alignItems: 'center',
      gap: Spacing[2],
    },
    emptyText: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
      textAlign: 'center',
    },
    emptySubtext: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.xs,
      color: Colors.text.tertiary[scheme],
      textAlign: 'center',
    },
  });
