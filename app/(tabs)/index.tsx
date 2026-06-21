import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

function SectionHeader({ title, count, onSeeAll }: { title: string; count: number; onSeeAll?: () => void }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-textPrimary font-bold text-xs tracking-widest uppercase">
          {title}
        </Text>
        <View className="bg-neutral-200 rounded-full px-2 py-0.5">
          <Text className="text-textSecondary text-xs font-medium">{count}</Text>
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} className="flex-row items-center gap-1">
          <Text className="text-textSecondary text-xs">Ver todos</Text>
          <Ionicons name="chevron-forward" size={12} color="#808399" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyCard({ icon, label }: { icon: string; label: string }) {
  return (
    <View className="bg-card rounded-2xl px-5 py-5 flex-row items-center gap-4 border border-border">
      <Ionicons name={icon as any} size={22} color="#505480" />
      <Text className="text-textSecondary text-sm">{label}</Text>
    </View>
  );
}

const nextEvents = [
  { id: "1", name: "Culto Domingo Manhã", date: "Dom · 09h00", ministry: "Louvor", color: "#9296AA" },
  { id: "2", name: "Culto Jovem", date: "Sex · 19h30", ministry: "Louvor + Mídia", color: "#6B6F80" },
];

export default function Dashboard() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Org card */}
        <View className="bg-cardHighlight rounded-3xl p-5 mb-6 border border-border">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-primary/20 items-center justify-center mr-4">
              <Text className="text-2xl">✝️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-bold text-base">Minha Igreja</Text>
              <View className="flex-row items-center gap-4 mt-1.5">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="calendar-outline" size={13} color="#808399" />
                  <Text className="text-textSecondary text-xs">3 eventos</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="musical-notes-outline" size={13} color="#808399" />
                  <Text className="text-textSecondary text-xs">5 ministérios</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="people-outline" size={13} color="#808399" />
                  <Text className="text-textSecondary text-xs">47 membros</Text>
                </View>
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-success/20 items-center justify-center">
              <Ionicons name="checkmark" size={16} color="#22C55E" />
            </View>
          </View>
        </View>

        {/* Próximos eventos */}
        <View className="mb-6">
          <SectionHeader title="Próximos eventos" count={nextEvents.length} onSeeAll={() => {}} />
          {nextEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              className="bg-card rounded-2xl px-4 py-4 mb-2 flex-row items-center border border-border"
            >
              <View
                className="w-2 h-10 rounded-full mr-4"
                style={{ backgroundColor: event.color }}
              />
              <View className="flex-1">
                <Text className="text-textPrimary font-semibold text-sm">{event.name}</Text>
                <Text className="text-textSecondary text-xs mt-0.5">{event.date}</Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: event.color + "22" }}
              >
                <Text className="text-xs font-medium" style={{ color: event.color }}>
                  {event.ministry}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Minhas escalas */}
        <View className="mb-6">
          <SectionHeader title="Minhas escalas" count={0} onSeeAll={() => {}} />
          <EmptyCard icon="calendar-outline" label="Nenhuma escala próxima." />
        </View>

        {/* Aniversariantes */}
        <View className="mb-6">
          <SectionHeader title="Aniversariantes" count={0} onSeeAll={() => {}} />
          <EmptyCard icon="gift-outline" label="Nenhum aniversariante este mês." />
        </View>

        {/* Destaque */}
        <TouchableOpacity className="bg-cardHighlight rounded-2xl px-5 py-5 flex-row items-center border border-border">
          <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-4">
            <Ionicons name="musical-note" size={20} color="#9296AA" />
          </View>
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold text-sm">Repertório</Text>
            <Text className="text-textSecondary text-xs mt-0.5">
              Músicas e cifras do ministério
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#505480" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
