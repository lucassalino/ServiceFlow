import { View, Text, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  hint?: string;
}

export function Input({ label, error, iconName, hint, secureTextEntry, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-textSecondary text-xs font-medium mb-1.5 ml-1 uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-card rounded-2xl px-4 border ${
          focused ? "border-primary" : error ? "border-error" : "border-border"
        }`}
        style={{ shadowColor: focused ? "#9296AA" : "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8 }}
      >
        {iconName && (
          <Ionicons name={iconName} size={18} color={focused ? "#9296AA" : "#3E4055"} style={{ marginRight: 10 }} />
        )}
        <TextInput
          className="flex-1 py-4 text-textPrimary text-base"
          placeholderTextColor="#505480"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure}
          style={{ fontFamily: "Poppins_400Regular" }}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecure(!secure)} className="ml-2 p-1">
            <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={18} color="#505480" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-error text-xs mt-1.5 ml-1">{error}</Text>}
      {hint && !error && <Text className="text-textSecondary text-xs mt-1.5 ml-1">{hint}</Text>}
    </View>
  );
}
