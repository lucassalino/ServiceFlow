import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconName?: string;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary:   { container: "bg-primary",           text: "text-white" },
  secondary: { container: "bg-neutral-200",        text: "text-textPrimary" },
  ghost:     { container: "bg-transparent border border-primary", text: "text-primary" },
  danger:    { container: "bg-error",              text: "text-white" },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-4 py-2.5 rounded-xl",  text: "text-sm" },
  md: { container: "px-6 py-3.5 rounded-2xl", text: "text-base" },
  lg: { container: "px-8 py-4 rounded-2xl",   text: "text-base" },
};

export function Button({
  label, onPress, variant = "primary", size = "md",
  loading = false, disabled = false, fullWidth = false,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${v.container} ${s.container} ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-50" : ""} flex-row items-center justify-center`}
    >
      {loading
        ? <ActivityIndicator color={variant === "ghost" ? "#9296AA" : "#fff"} size="small" />
        : <Text className={`${s.text} ${v.text} font-semibold`} style={{ fontFamily: "Poppins_600SemiBold" }}>{label}</Text>
      }
    </TouchableOpacity>
  );
}
