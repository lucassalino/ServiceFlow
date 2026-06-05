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
  
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';

export default function LoginScreen() {
  const scheme = useTheme();
  const s = styles(scheme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError('Preenche o email e a palavra-passe.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
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
      <View style={s.inner}>
        <Text style={s.logo}>ServiceFlow</Text>
        <Text style={s.subtitle}>Gestão de escalas de ministério</Text>

        <View style={s.form}>
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
            placeholder="Palavra-passe"
            placeholderTextColor={Colors.gray400}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.gray50} />
              : <Text style={s.buttonText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={s.linkText}>Não tens conta? Regista-te</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (scheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background[scheme],
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  logo: {
    fontFamily: Typography.fonts.bold,
    fontSize: Typography.sizes['2xl'],
    color: Colors.text.primary[scheme],
    marginBottom: Spacing[1],
  },
  subtitle: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary[scheme],
    marginBottom: Spacing[8],
  },
  form: {
    gap: Spacing[3],
  },
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
  buttonText: {
    fontFamily: Typography.fonts.semiBold,
    fontSize: Typography.sizes.base,
    color: Colors.background[scheme],
  },
  linkText: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary[scheme],
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  errorText: {
    fontFamily: Typography.fonts.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    textAlign: 'center',
  },
});
