import { View, TouchableOpacity } from "react-native";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  highlight?: boolean;
}

const paddingMap = { none: "", sm: "p-3", md: "p-4", lg: "p-5" };

export function Card({ children, onPress, className = "", padding = "md", highlight = false }: CardProps) {
  const base = `${highlight ? "bg-cardHighlight" : "bg-card"} rounded-2xl border border-border ${paddingMap[padding]} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} className={base}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View className={base}>{children}</View>;
}
