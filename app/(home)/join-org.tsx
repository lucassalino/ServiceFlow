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
import { useJoinOrganization } from '@/hooks/useOrganizations';

export default function JoinOrgScreen() {
  const scheme = useTheme();
  const s = styles(scheme);
  const [inviteCode, setInviteCode] = useState('');
  const { mutate: joinOrg, isPending, error } = useJoinOrganization();

  function handleJoin() {
    if (!inviteCode.trim()) return;
    joinOrg(inviteCode.trim().toUpperCase(), {
      onSuccess: () => router.replace('/(home)'),
    });
  }

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={s.title}>Entrar numa organização</Text>
      <Text style={s.subtitle}>Usa o código de convite fornecido pelo administrador</Text>

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Código de convite (ex: ABC123)"
          placeholderTextColor={Colors.gray400}
          autoCapitalize="characters"
          value={inviteCode}
          onChangeText={setInviteCode}
        />
        {error && <Text style={s.errorText}>{(error as Error).message}</Text>}
        <TouchableOpacity style={s.button} onPress={handleJoin} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color={Colors.gray50} />
            : <Text style={s.buttonText}>Entrar</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>ou</Text>
        <View style={s.dividerLine} />
      </View>

      <TouchableOpacity
        style={s.createButton}
        onPress={() => router.push('/(home)/create-org')}
      >
        <Text style={s.createButtonText}>Criar nova organização</Text>
      </TouchableOpacity>
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
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary[scheme],
    backgroundColor: Colors.surface[scheme],
    letterSpacing: 2,
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginVertical: Spacing[6] },
  dividerLine: { flex: 1, height: BorderWidth.hairline, backgroundColor: Colors.border[scheme] },
  dividerText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.tertiary[scheme] },
  createButton: {
    height: 48,
    borderRadius: Radii.md,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.border[scheme],
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: { fontFamily: Typography.fonts.medium, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme] },
});
