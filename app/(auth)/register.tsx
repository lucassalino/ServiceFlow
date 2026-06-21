import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase/client";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Nome obrigatório";
    if (!email) e.email = "Email obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "Senha obrigatória";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!confirm) e.confirm = "Confirme sua senha";
    else if (confirm !== password) e.confirm = "As senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Erro ao cadastrar", error.message);
      return;
    }

    Alert.alert(
      "Conta criada!",
      "Verifique seu email para confirmar o cadastro.",
      [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View className="px-5 pt-4 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-card rounded-xl items-center justify-center border border-border">
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="px-6 pt-8 pb-8">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-primary/15 rounded-2xl items-center justify-center mb-4 border border-primary/30">
                <Text className="text-3xl">✝️</Text>
              </View>
              <Text className="text-textPrimary text-2xl font-bold">Criar conta</Text>
              <Text className="text-textSecondary text-sm mt-1 text-center">Junte-se ao ServiceFlow</Text>
            </View>

            <Input label="Nome completo" iconName="person-outline" placeholder="Seu nome" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
            <Input label="Email" iconName="mail-outline" placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
            <Input label="Senha" iconName="lock-closed-outline" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
            <Input label="Confirmar senha" iconName="lock-closed-outline" placeholder="Repita sua senha" value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} />

            <View className="mt-2">
              <Button label="Criar conta" onPress={handleRegister} loading={loading} fullWidth size="lg" />
            </View>

            <View className="flex-row justify-center mt-6">
              <Text className="text-textSecondary text-sm">Já tem conta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary text-sm font-semibold">Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
