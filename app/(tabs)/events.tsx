import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  color: string;
  ministries: string[];
}

const COLOR_OPTIONS = [
  "#9296AA", "#6B6F80", "#8B8FA8", "#B0B4C8",
  "#4E5060", "#3E4055", "#555770", "#2E3040",
];

const MINISTRY_OPTIONS = ["Louvor", "Infantil", "Mídia", "Recepção", "Intercessão"];

const INITIAL_EVENTS: Event[] = [
  {
    id: "1",
    name: "Culto Domingo Manhã",
    date: "25/05/2026",
    time: "09:00",
    location: "Santuário Principal",
    description: "Culto dominical da manhã",
    color: "#4F46E5",
    ministries: ["Louvor", "Mídia", "Recepção"],
  },
  {
    id: "2",
    name: "Culto Jovem",
    date: "30/05/2026",
    time: "19:30",
    location: "Auditório",
    description: "Culto para jovens",
    color: "#6B6F80",
    ministries: ["Louvor", "Mídia"],
  },
  {
    id: "3",
    name: "Escola Bíblica",
    date: "25/05/2026",
    time: "08:00",
    location: "Salas de Aula",
    description: "Escola bíblica dominical",
    color: "#059669",
    ministries: ["Infantil"],
  },
];

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4F46E5");
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; date?: string; time?: string }>({});

  function resetForm() {
    setName(""); setDate(""); setTime(""); setLocation("");
    setDescription(""); setSelectedColor("#4F46E5"); setSelectedMinistries([]);
    setErrors({});
  }

  function toggleMinistry(m: string) {
    setSelectedMinistries((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  function formatDate(text: string) {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  function formatTime(text: string) {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }

  function handleCreate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Nome obrigatório";
    if (!date.trim() || date.length < 10) e.date = "Data inválida (DD/MM/AAAA)";
    if (!time.trim() || time.length < 5) e.time = "Hora inválida (HH:MM)";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const newEvent: Event = {
      id: Date.now().toString(),
      name: name.trim(),
      date,
      time,
      location: location.trim(),
      description: description.trim(),
      color: selectedColor,
      ministries: selectedMinistries,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setModalVisible(false);
    resetForm();
  }

  function handleDelete(id: string) {
    Alert.alert("Remover evento", "Tem certeza que deseja remover este evento?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => setEvents((prev) => prev.filter((e) => e.id !== id)) },
    ]);
  }

  const weekDay = (dateStr: string) => {
    try {
      const [d, m, y] = dateStr.split("/");
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      return days[new Date(`${y}-${m}-${d}`).getDay()] ?? "";
    } catch { return ""; }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-4 pb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-textPrimary text-2xl font-bold">Eventos</Text>
          <Text className="text-textPrimary/50 text-sm mt-0.5">
            {events.length} eventos cadastrados
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
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card className="mb-3" onPress={() => {}}>
            <View className="flex-row items-start">
              {/* Data box */}
              <View
                className="w-14 rounded-2xl items-center justify-center py-2 mr-4"
                style={{ backgroundColor: item.color + "18" }}
              >
                <Text className="text-xs font-semibold" style={{ color: item.color }}>
                  {weekDay(item.date)}
                </Text>
                <Text className="text-xl font-bold" style={{ color: item.color }}>
                  {item.date.split("/")[0]}
                </Text>
                <Text className="text-xs" style={{ color: item.color + "99" }}>
                  {item.date.split("/")[1]}/{item.date.split("/")[2]?.slice(2)}
                </Text>
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="text-textPrimary font-bold text-base">{item.name}</Text>
                <View className="flex-row items-center mt-1 gap-3">
                  <Text className="text-textPrimary/50 text-xs">🕐 {item.time}</Text>
                  {item.location ? (
                    <Text className="text-textPrimary/50 text-xs" numberOfLines={1}>
                      📍 {item.location}
                    </Text>
                  ) : null}
                </View>

                {/* Ministérios */}
                {item.ministries.length > 0 && (
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {item.ministries.map((m) => (
                      <View
                        key={m}
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: item.color + "18" }}
                      >
                        <Text className="text-xs font-medium" style={{ color: item.color }}>
                          {m}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Delete */}
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                className="w-7 h-7 bg-error/10 rounded-xl items-center justify-center ml-2"
              >
                <Text className="text-error text-xs">✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">📅</Text>
            <Text className="text-textPrimary font-semibold text-base">Nenhum evento</Text>
            <Text className="text-textPrimary/50 text-sm mt-1 text-center">
              Toque no + para criar{"\n"}seu primeiro evento
            </Text>
          </View>
        }
      />

      {/* Modal criar evento */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <View className="flex-1 bg-background">
          <View className="px-6 pt-6 pb-4 flex-row items-center justify-between border-b border-neutral-100">
            <Text className="text-textPrimary text-xl font-bold">Novo evento</Text>
            <TouchableOpacity
              onPress={() => { setModalVisible(false); resetForm(); }}
              className="w-9 h-9 bg-neutral-100 rounded-xl items-center justify-center"
            >
              <Text className="text-textPrimary/60 text-base">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-5" showsVerticalScrollIndicator={false}>
            <Input
              label="Nome do evento *"
              placeholder="Ex: Culto Domingo, Vigília..."
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Data *"
                  placeholder="DD/MM/AAAA"
                  value={date}
                  onChangeText={(t) => setDate(formatDate(t))}
                  keyboardType="numeric"
                  maxLength={10}
                  error={errors.date}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Hora *"
                  placeholder="HH:MM"
                  value={time}
                  onChangeText={(t) => setTime(formatTime(t))}
                  keyboardType="numeric"
                  maxLength={5}
                  error={errors.time}
                />
              </View>
            </View>

            <Input
              label="Local"
              placeholder="Ex: Santuário, Auditório..."
              value={location}
              onChangeText={setLocation}
            />

            <Input
              label="Descrição"
              placeholder="Informações adicionais..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            {/* Cor */}
            <Text className="text-textPrimary font-medium text-sm mb-3">Cor do evento</Text>
            <View className="flex-row gap-3 mb-5">
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className={`w-9 h-9 rounded-full ${selectedColor === color ? "border-4 border-white" : ""}`}
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

            {/* Ministérios */}
            <Text className="text-textPrimary font-medium text-sm mb-3">Ministérios envolvidos</Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {MINISTRY_OPTIONS.map((m) => {
                const active = selectedMinistries.includes(m);
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => toggleMinistry(m)}
                    className={`px-4 py-2 rounded-full border ${
                      active ? "bg-primary border-primary" : "bg-transparent border-neutral-200"
                    }`}
                  >
                    <Text className={`text-sm font-medium ${active ? "text-white" : "text-textPrimary/60"}`}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button label="Criar evento" onPress={handleCreate} fullWidth size="lg" />
            <View className="h-8" />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
