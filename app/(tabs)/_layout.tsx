import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDrawerStore } from "../../lib/store/drawerStore";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TABS: { name: string; label: string; icon: IoniconName; iconActive: IoniconName }[] = [
  { name: "index",    label: "Início",     icon: "home-outline",          iconActive: "home" },
  { name: "events",   label: "Eventos",    icon: "calendar-outline",      iconActive: "calendar" },
  { name: "ministry", label: "Ministérios",icon: "musical-notes-outline", iconActive: "musical-notes" },
  { name: "profile",  label: "Perfil",     icon: "person-outline",        iconActive: "person" },
];

function TabIcon({ focused, icon, iconActive, label }: {
  focused: boolean;
  icon: IoniconName;
  iconActive: IoniconName;
  label: string;
}) {
  return (
    <View className="items-center justify-center">
      <View
        className={`px-4 py-1.5 rounded-full ${focused ? "bg-primary/20" : ""}`}
      >
        <Ionicons
          name={focused ? iconActive : icon}
          size={22}
          color={focused ? "#9296AA" : "#3E4055"}
        />
      </View>
      <Text
        className="text-xs mt-0.5"
        style={{ color: focused ? "#9296AA" : "#3E4055", fontFamily: "Poppins_500Medium" }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const openDrawer = useDrawerStore((s) => s.open);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#07080F" },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: "#FFFFFF",
          fontFamily: "Poppins_700Bold",
          fontSize: 22,
        },
        headerLeft: () => (
          <TouchableOpacity onPress={openDrawer} className="ml-5 p-1">
            <Ionicons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#0D1020",
          borderTopColor: "#1C1E30",
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon={tab.icon}
                iconActive={tab.iconActive}
                label={tab.label}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
