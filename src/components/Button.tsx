import React from "react";
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Colors, BorderRadius, Spacing, Typography } from "../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "accent" | "outline";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Colors.border;
    if (variant === "primary") return Colors.primary;
    if (variant === "accent") return Colors.accent;
    return "transparent";
  };

  const getTextColor = () => {
    if (disabled) return Colors.textSecondary;
    if (variant === "outline") return Colors.primary;
    return Colors.surface;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === "outline" && styles.outlineButton,
        style,
      ]}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: BorderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  text: {
    ...Typography.bodyLarge,
    fontWeight: "600",
  },
});
