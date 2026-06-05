import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useMinistries, useDeleteMinistry } from '@/hooks/useMinistries';
import { useOrgStore } from '@/stores/orgStore';
import { MinistryCard } from '@/components/ui/MinistryCard';
import { Colors, Spacing, Radii, Typography } from '@/constants';
import type { Ministry } from '@/types';

export default function MinistriesScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const { activeMembership } = useOrgStore();
  const { data: ministries, isLoading } = useMinistries();
  const { mutate: deleteMinistry } = useDeleteMinistry();

  const canWrite = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';

  function handleLongPress(ministry: Ministry) {
    if (!canWrite) return;
    Alert.alert(
      ministry.name,
      'O que pretendes fazer?',
      [
        {
          text: 'Editar',
          onPress: () => router.push(`/(org)/${orgId}/ministries/${ministry.id}/edit`),
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Confirmar eliminação',
              `Tens a certeza que queres eliminar "${ministry.name}"?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: () => deleteMinistry(ministry.id),
                },
              ],
            ),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Ministérios</Text>
          <Text style={s.subtitle}>
            {ministries?.length ?? 0}{' '}
            {ministries?.length === 1 ? 'ministério' : 'ministérios'}
          </Text>
        </View>
        {canWrite && (
          <TouchableOpacity
            style={s.addButton}
            onPress={() => router.push(`/(org)/${orgId}/ministries/new`)}
          >
            <Text style={s.addButtonText}>+ Novo</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={Colors.gray400} />
        </View>
      ) : (
        <FlatList
          data={ministries ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <EmptyState scheme={scheme} orgId={orgId ?? ''} canWrite={canWrite} />
          }
          renderItem={({ item }) => (
            <MinistryCard
              ministry={item}
              onPress={() => router.push(`/(org)/${orgId}/ministries/${item.id}`)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function EmptyState({
  scheme,
  orgId,
  canWrite,
}: {
  scheme: 'light' | 'dark';
  orgId: string;
  canWrite: boolean;
}) {
  const s = styles(scheme);
  return (
    <View style={s.empty}>
      <Text style={s.emptyEmoji}>🎵</Text>
      <Text style={s.emptyTitle}>Sem ministérios</Text>
      <Text style={s.emptyText}>
        {canWrite
          ? 'Cria o primeiro ministério da tua organização.'
          : 'Ainda não há ministérios nesta organização.'}
      </Text>
      {canWrite && (
        <TouchableOpacity
          style={s.emptyButton}
          onPress={() => router.push(`/(org)/${orgId}/ministries/new`)}
        >
          <Text style={s.emptyButtonText}>Criar ministério</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background[scheme] },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing[6],
      paddingTop: 60,
      paddingBottom: Spacing[5],
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
    addButton: {
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[2],
      backgroundColor: Colors.text.primary[scheme],
      borderRadius: Radii.full,
    },
    addButtonText: {
      fontFamily: Typography.fonts.semiBold,
      fontSize: Typography.sizes.sm,
      color: Colors.background[scheme],
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: Spacing[6], gap: Spacing[2], paddingBottom: Spacing[8] },
    empty: {
      paddingTop: 80,
      alignItems: 'center',
      paddingHorizontal: Spacing[8],
    },
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
      marginBottom: Spacing[6],
    },
    emptyButton: {
      paddingHorizontal: Spacing[6],
      paddingVertical: Spacing[3],
      backgroundColor: Colors.text.primary[scheme],
      borderRadius: Radii.full,
    },
    emptyButtonText: {
      fontFamily: Typography.fonts.semiBold,
      fontSize: Typography.sizes.sm,
      color: Colors.background[scheme],
    },
  });
