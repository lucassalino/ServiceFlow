import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCreateMinistry } from '@/hooks/useMinistries';
import { MinistryForm } from '@/components/forms/MinistryForm';
import { Colors, Spacing, Typography } from '@/constants';

export default function NewMinistryScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const { mutate: createMinistry, isPending, error } = useCreateMinistry();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Novo ministério</Text>
      </View>

      <MinistryForm
        submitLabel="Criar ministério"
        isLoading={isPending}
        error={error ? (error as Error).message : null}
        onSubmit={(values) =>
          createMinistry(values, { onSuccess: () => router.back() })
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
