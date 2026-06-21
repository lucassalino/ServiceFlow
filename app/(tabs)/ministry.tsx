import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface Ministry {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  membersCount: number;
  leader: string;
}

const ICON_OPTIONS = ["🎵", "🙏", "👶", "📸", "🎤", "📖", "🎹", "🥁", "🎸", "✝️", "🕊️", "🌟"];
const COLOR_OPTIONS = [
  "#9296AA", "#6B6F80", "#8B8FA8", "#B0B4C8",
  "#4E5060", "#3E4055", "#555770", "#2E3040",
];

const INITIAL_MINISTRIES: Ministry[] = [
  { id: "1", name: "Louvor", description: "Ministério de louvor e adoração", icon: "🎵", color: "#9296AA", membersCount: 12, leader: "João Silva" },
  { id: "2", name: "Infantil", description: "Ministério para crianças", icon: "👶", color: "#8B8FA8", membersCount: 8, leader: "Ana Costa" },
  { id: "3", name: "Mídia", description: "Transmissão e comunicação", icon: "📸", color: "#6B6F80", membersCount: 5, leader: "Pedro Lopes" },
  { id: "4", name: "Recepção", description: "Acolhimento e hospitalidade", icon: "🕊️", color: "#B0B4C8", membersCount: 10, leader: "Maria Santos" },
  { id: "5", name: "Intercessão", description: "Grupo de oração e intercessão", icon: "🙏", color: "#555770", membersCount: 15, leader: "Carla Alves" },
];

export default function MinistryScreen() {
  const [ministries, setMinistries] = useState<Ministry[]>(INITIAL_MINISTRIES);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leader, setLeader] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🎵");
  const [selectedColor, setSelectedColor] = useState("#4F46E5");
  const [errors, setErrors] = useState<{ name?: string; leader?: string }>({});

  function resetForm() {
    setName("");
    setDescription("");
    setLeader("");
    setSelectedIcon("🎵");
    setSelectedColor("#4F46E5");
    setErrors({});
  }

  function handleCreate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Nome obrigatório";
    if (!leader.trim()) e.leader = "Líder obrigatório";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const newMinistry: Ministry = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
      color: selectedColor,
      membersCount: 0,
      leader: leader.trim(),
    };
    setMinistries((prev) => [newMinistry, ...prev]);
    setModalVisible(false);
    resetForm();
  }

  function handleDelete(id: string) {
    Alert.alert("Remover ministério", "Tem certeza que deseja remover este ministério?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => setMinistries((prev) => prev.filter((m) => m.id !== id)) },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-4 pb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-textPrimary text-2xl font-bold">Ministérios</Text>
          <Text className="text-textPrimary/50 text-sm mt-0.5">
            {ministries.length} ministérios ativos
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="w-11 h-11 bg-primary rounded-2xl items-center justify-center"
          style={{ shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
        >
          <Text className="text-white text-2xl leading-none">+</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={ministries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card className="mb-3" onPress={() => {}}>
            <View className="flex-row items-center">
              {/* Ícone */}
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: item.color + "18" }}
              >
                <Text className="text-2xl">{item.icon}</Text>
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="text-textPrimary font-bold text-base">{item.name}</Text>
                {item.description ? (
                  <Text className="text-textPrimary/50 text-xs mt-0.5" numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
                <View className="flex-row items-center mt-2 gap-3">
                  <View className="flex-row items-center">
                    <Text className="text-xs mr-1">👥</Text>
                    <Text className="text-textPrimary/60 text-xs font-medium">
                      {item.membersCount} membros
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-xs mr-1">👑</Text>
                    <Text className="text-textPrimary/60 text-xs font-medium">
                      {item.leader}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Badge cor + delete */}
              <View className="items-center gap-2">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  className="w-7 h-7 bg-error/10 rounded-xl items-center justify-center"
                >
                  <Text className="text-error text-xs">✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">🎵</Text>
            <Text className="text-textPrimary font-semibold text-base">Nenhum ministério</Text>
            <Text className="text-textPrimary/50 text-sm mt-1 text-center">
              Toque no + para adicionar{"\n"}seu primeiro ministério
            </Text>
          </View>
        }
      />

      {/* Modal criar ministério */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <View className="flex-1 bg-background">
          {/* Header modal */}
          <View className="px-6 pt-6 pb-4 flex-row items-center justify-between border-b border-neutral-100">
            <Text className="text-textPrimary text-xl font-bold">Novo ministério</Text>
            <TouchableOpacity
              onPress={() => { setModalVisible(false); resetForm(); }}
              className="w-9 h-9 bg-neutral-100 rounded-xl items-center justify-center"
            >
              <Text className="text-textPrimary/60 text-base">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-5" showsVerticalScrollIndicator={false}>
            {/* Preview */}
            <View className="items-center mb-6">
              <View
                className="w-20 h-20 rounded-3xl items-center justify-center"
                style={{ backgroundColor: selectedColor + "18" }}
              >
                <Text className="text-4xl">{selectedIcon}</Text>
              </View>
            </View>

            <Input
              label="Nome do ministério *"
              placeholder="Ex: Louvor, Infantil, Mídia..."
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <Input
              label="Descrição"
              placeholder="Descreva brevemente o ministério"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Líder responsável *"
              placeholder="Nome do líder"
              value={leader}
              onChangeText={setLeader}
              error={errors.leader}
            />

            {/* Ícone */}
            <Text className="text-textPrimary font-medium text-sm mb-3">Ícone</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    selectedIcon === icon ? "bg-primary/15 border-2 border-primary" : "bg-neutral-100"
                  }`}
                >
                  <Text className="text-2xl">{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cor */}
            <Text className="text-textPrimary font-medium text-sm mb-3">Cor</Text>
            <View className="flex-row gap-3 mb-8">
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className={`w-9 h-9 rounded-full ${
                    selectedColor === color ? "border-4 border-white" : ""
                  }`}
                  style={{
                    backgroundColor: color,
                    shadowColor: selectedColor === color ? color : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                    elevation: selectedColor === color ? 4 : 0,
                  }}
                />
              ))}
            </View>

            <Button
              label="Criar ministério"
              onPress={handleCreate}
              fullWidth
              size="lg"
            />

            <View className="h-8" />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
