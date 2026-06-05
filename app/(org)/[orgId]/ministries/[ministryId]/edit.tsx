import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useMinistries, useUpdateMinistry } from '@/hooks/useMinistries';
import { MinistryForm } from '@/components/forms/MinistryForm';
import { Colors, Spacing, Typography } from '@/constants';

export default function EditMinistryScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { ministryId } = useLocalSearchParams<{ ministryId: string }>();
  const { data: ministries, isLoading } = useMinistries();
  const { mutate: updateMinistry, isPending, error } = useUpdateMinistry();

  const ministry = ministries?.find((m) => m.id === ministryId);

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
        <Text style={{ color: Colors.text.secondary[scheme] }}>Ministério não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Editar ministério</Text>
      </View>

      <MinistryForm
        initialValues={{ name: ministry.name, icon: ministry.icon, color: ministry.color }}
        submitLabel="Guardar alterações"
        isLoading={isPending}
        error={error ? (error as Error).message : null}
        onSubmit={(values) =>
          updateMinistry(
            { id: ministryId ?? '', ...values },
            { onSuccess: () => router.back() },
          )
        }
      />
    </View>
  );
}

const styles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background[scheme] },
    header: {
      paddingHorizontal: Spacing[6],
      paddingTop: 60,
      paddingBottom: Spacing[4],
      gap: Spacing[4],
    },
    backText: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
    },
    title: {
      fontFamily: Typography.fonts.bold,
      fontSize: Typography.sizes.xl,
      color: Colors.text.primary[scheme],
    },
  });
