import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { supabase } from "../../lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = "Email obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "Senha obrigatória";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      Alert.alert("Erro ao entrar", error.message === "Invalid login credentials"
        ? "Email ou senha incorretos."
        : error.message
      );
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View className="items-center pt-16 pb-12 px-6">
            <View className="w-20 h-20 bg-primary/15 rounded-3xl items-center justify-center mb-5 border border-primary/30">
              <Text className="text-4xl">✝️</Text>
            </View>
            <Text className="text-textPrimary text-3xl font-bold tracking-tight">ServiceFlow</Text>
            <Text className="text-textSecondary text-sm mt-1">Gestão de escalas ministeriais</Text>
          </View>

          <View className="flex-1 px-6">
            <Text className="text-textPrimary text-xl font-bold mb-1">Entrar</Text>
            <Text className="text-textSecondary text-sm mb-8">Acesse sua conta para continuar</Text>

            <Input
              label="Email"
              iconName="mail-outline"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Senha"
              iconName="lock-closed-outline"
              placeholder="Sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <TouchableOpacity className="self-end -mt-2 mb-8">
              <Text className="text-primary text-sm font-medium">Esqueci minha senha</Text>
            </TouchableOpacity>

            <Button label="Entrar" onPress={handleLogin} loading={loading} fullWidth size="lg" />

            <View className="flex-row items-center my-7">
              <View className="flex-1 h-px bg-border" />
              <Text className="mx-4 text-textSecondary text-sm">ou</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            <View className="flex-row justify-center pb-8">
              <Text className="text-textSecondary text-sm">Não tem conta? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text className="text-primary text-sm font-semibold">Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
