import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { useEffect, useRef } from "react";
import { useDrawerStore } from "../../lib/store/drawerStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.78;

const menuItems = [
  { icon: "grid-outline", label: "Visão geral", route: "/(tabs)" },
  { icon: "calendar-outline", label: "Eventos", route: "/(tabs)/events" },
  { icon: "musical-notes-outline", label: "Ministérios", route: "/(tabs)/ministry" },
  { icon: "people-outline", label: "Membros", route: "/(tabs)" },
  { icon: "gift-outline", label: "Aniversariantes", route: "/(tabs)" },
  { icon: "notifications-outline", label: "Notificações", route: "/(tabs)" },
];

export function DrawerMenu() {
  const { isOpen, close } = useDrawerStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function navigate(route: string) {
    close();
    router.push(route as any);
  }

  return (
    <View className="absolute inset-0" style={{ zIndex: 999 }}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", opacity: overlayOpacity }}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        className="absolute top-0 bottom-0 left-0 bg-surface"
        style={{ width: DRAWER_WIDTH, transform: [{ translateX }] }}
      >
        {/* Profile card */}
        <View className="bg-cardHighlight mx-5 mt-16 mb-6 p-4 rounded-2xl">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/30 items-center justify-center mr-3">
              <Ionicons name="person" size={22} color="#9296AA" />
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-bold text-base" numberOfLines={1}>
                Lucas Salino
              </Text>
              <Text className="text-textSecondary text-xs" numberOfLines={1}>
                it.workdeveloper@gmail.com
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#808399" />
          </View>
        </View>

        {/* Menu items */}
        <View className="flex-1 px-3">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => navigate(item.route)}
              className="flex-row items-center px-4 py-3.5 rounded-2xl mb-1 active:bg-neutral-100"
            >
              <Ionicons name={item.icon as any} size={22} color="#808399" />
              <Text className="text-textPrimary font-medium text-base ml-4">
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <TouchableOpacity
          onPress={close}
          className="flex-row items-center px-7 py-6 border-t border-border"
        >
          <Ionicons name="settings-outline" size={22} color="#808399" />
          <Text className="text-textPrimary font-medium text-base ml-4">
            Configurações
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
