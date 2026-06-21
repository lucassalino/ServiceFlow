import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

const menuItems = [
  { icon: "person-outline",           label: "Meu perfil",   sub: "Editar informações pessoais" },
  { icon: "notifications-outline",    label: "Notificações", sub: "Preferências de avisos" },
  { icon: "shield-checkmark-outline", label: "Privacidade",  sub: "Segurança da conta" },
  { icon: "help-circle-outline",      label: "Ajuda",        sub: "Suporte e documentação" },
];

export default function ProfileScreen() {
  const [userName, setUserName] = useState("Utilizador");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        setUserName(user.user_metadata?.full_name ?? user.email ?? "Utilizador");
      }
    });
  }, []);

  async function handleLogout() {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>

        <View className="items-center py-6">
          <View className="w-24 h-24 rounded-3xl bg-primary/20 items-center justify-center border-2 border-primary/30 mb-4">
            <Ionicons name="person" size={40} color="#9296AA" />
          </View>
          <Text className="text-textPrimary text-xl font-bold">{userName}</Text>
          <Text className="text-textSecondary text-sm mt-1">{userEmail}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="bg-success/20 px-3 py-1 rounded-full">
              <Text className="text-success text-xs font-medium">Ativo</Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          {[
            { label: "Ministérios", value: "—" },
            { label: "Eventos",     value: "—" },
            { label: "Escalas",     value: "—" },
          ].map((s) => (
            <View key={s.label} className="flex-1 bg-card rounded-2xl py-4 items-center border border-border">
              <Text className="text-textPrimary text-2xl font-bold">{s.value}</Text>
              <Text className="text-textSecondary text-xs mt-1">{s.label}</Text>
            </View>
          ))}
        </View>

        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center px-5 py-4 ${i < menuItems.length - 1 ? "border-b border-border" : ""}`}
            >
              <View className="w-9 h-9 rounded-xl bg-primary/15 items-center justify-center mr-4">
                <Ionicons name={item.icon as any} size={18} color="#9296AA" />
              </View>
              <View className="flex-1">
                <Text className="text-textPrimary font-medium text-sm">{item.label}</Text>
                <Text className="text-textSecondary text-xs mt-0.5">{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#3E4055" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-error/10 rounded-2xl py-4 flex-row items-center justify-center gap-3 border border-error/20"
        >
          <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
          <Text className="text-error font-semibold">Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
