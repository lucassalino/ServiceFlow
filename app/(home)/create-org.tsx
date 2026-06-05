import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';
import { useCreateOrganization } from '@/hooks/useOrganizations';

export default function CreateOrgScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const [name, setName] = useState('');
  const { mutate: createOrg, isPending, error } = useCreateOrganization();

  function handleCreate() {
    if (!name.trim()) return;
    createOrg(name.trim(), {
      onSuccess: () => router.replace('/(home)'),
    });
  }

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={s.title}>Nova organização</Text>
      <Text style={s.subtitle}>Cria a tua igreja ou comunidade</Text>

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Nome da organização"
          placeholderTextColor={Colors.gray400}
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
        {error && <Text style={s.errorText}>{(error as Error).message}</Text>}
        <TouchableOpacity style={s.button} onPress={handleCreate} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color={Colors.gray50} />
            : <Text style={s.buttonText}>Criar organização</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (scheme: 'light' | 'dark') => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background[scheme], paddingHorizontal: Spacing[6], paddingTop: 64 },
  backBtn: { marginBottom: Spacing[6] },
  backText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme] },
  title: { fontFamily: Typography.fonts.bold, fontSize: Typography.sizes.xl, color: Colors.text.primary[scheme], marginBottom: Spacing[1] },
  subtitle: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme], marginBottom: Spacing[8] },
  form: { gap: Spacing[3] },
  input: {
    height: 48,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.border[scheme],
    borderRadius: Radii.md,
    paddingHorizontal: Spacing[4],
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary[scheme],
    backgroundColor: Colors.surface[scheme],
  },
  button: {
    height: 48,
    backgroundColor: Colors.text.primary[scheme],
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.base, color: Colors.background[scheme] },
  errorText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.error, textAlign: 'center' },
});
