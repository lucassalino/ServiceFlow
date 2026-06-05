import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useOrgMembers } from '@/hooks/useMembers';
import { MemberCard } from '@/components/ui/MemberCard';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';

export default function MembersScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const { data: members, isLoading } = useOrgMembers();
  const [search, setSearch] = useState('');
  void orgId; // consumed in renderItem navigation

  const filtered = (members ?? []).filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = m.profile?.full_name?.toLowerCase() ?? '';
    const email = m.profile?.email?.toLowerCase() ?? '';
    return name.includes(q) || email.includes(q);
  });

  const active = filtered.filter((m) => m.is_active);
  const inactive = filtered.filter((m) => !m.is_active);


  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Pessoas</Text>
          <Text style={s.subtitle}>
            {members?.filter((m) => m.is_active).length ?? 0} ativos
            {inactive.length > 0 ? ` · ${inactive.length} inativos` : ''}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrapper}>
        <TextInput
          style={s.searchInput}
          placeholder="Pesquisar por nome ou email..."
          placeholderTextColor={Colors.gray400}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={Colors.gray400} />
        </View>
      ) : (
        <FlatList
          data={[...active, ...inactive]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<EmptyState scheme={scheme} hasSearch={!!search} />}
          // Section header before inactive members
          renderItem={({ item, index }) => {
            const isFirstInactive = inactive.length > 0 && index === active.length;
            return (
              <>
                {isFirstInactive && (
                  <Text style={s.sectionLabel}>Inativos</Text>
                )}
                <MemberCard
                  member={item}
                  onPress={() => router.push(`/(org)/${orgId}/members/${item.user_id}`)}
                />
              </>
            );
          }}
        />
      )}
    </View>
  );
}

function EmptyState({ scheme, hasSearch }: { scheme: 'light' | 'dark'; hasSearch: boolean }) {
  const s = styles(scheme);
  return (
    <View style={s.empty}>
      <Text style={s.emptyEmoji}>👥</Text>
      <Text style={s.emptyTitle}>
        {hasSearch ? 'Sem resultados' : 'Sem membros'}
      </Text>
      <Text style={s.emptyText}>
        {hasSearch
          ? 'Tenta pesquisar com outros termos.'
          : 'Os membros aparecem aqui quando aceitam o convite.'}
      </Text>
    </View>
  );
}

const styles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background[scheme] },
    header: {
      paddingHorizontal: Spacing[6],
      paddingTop: 60,
      paddingBottom: Spacing[3],
    },
    title: {
      fontFamily: Typography.fonts.bold,
      fontSize: Typography.sizes.xl,
      color: Colors.text.primary[scheme],
    },
    subtitle: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
      marginTop: 2,
    },
    searchWrapper: {
      paddingHorizontal: Spacing[6],
      paddingBottom: Spacing[4],
    },
    searchInput: {
      height: 44,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      borderRadius: Radii.md,
      paddingHorizontal: Spacing[4],
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.primary[scheme],
      backgroundColor: Colors.surface[scheme],
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: Spacing[6], gap: Spacing[2], paddingBottom: Spacing[8] },
    sectionLabel: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.xs,
      color: Colors.text.tertiary[scheme],
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: Spacing[4],
      marginBottom: Spacing[1],
    },
    empty: { paddingTop: 80, alignItems: 'center', paddingHorizontal: Spacing[8] },
    emptyEmoji: { fontSize: 40, marginBottom: Spacing[4] },
    emptyTitle: {
      fontFamily: Typography.fonts.semiBold,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary[scheme],
      marginBottom: Spacing[2],
    },
    emptyText: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
      textAlign: 'center',
      lineHeight: 20,
    },
  });
