import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';

export default function RegisterScreen() {
  const scheme = useTheme();
  const s = styles(scheme);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      setError('Preenche todos os campos.');
      return;
    }
    if (password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.replace('/(home)');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.container}
    >
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.title}>Criar conta</Text>
        <Text style={s.subtitle}>Começa a gerir o teu ministério</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Nome completo"
            placeholderTextColor={Colors.gray400}
            autoCapitalize="words"
            autoComplete="name"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={Colors.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={s.input}
            placeholder="Palavra-passe (mín. 8 caracteres)"
            placeholderTextColor={Colors.gray400}
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={s.button} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.gray50} />
              : <Text style={s.buttonText}>Criar conta</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (scheme: 'light' | 'dark') => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background[scheme] },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing[6], paddingVertical: Spacing[8] },
  backBtn: { marginBottom: Spacing[6] },
  backText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.text.secondary[scheme] },
  title: { fontFamily: Typography.fonts.bold, fontSize: Typography.sizes['2xl'], color: Colors.text.primary[scheme], marginBottom: Spacing[1] },
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
    marginTop: Spacing[2],
  },
  buttonText: { fontFamily: Typography.fonts.semiBold, fontSize: Typography.sizes.base, color: Colors.background[scheme] },
  errorText: { fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm, color: Colors.error, textAlign: 'center' },
});
