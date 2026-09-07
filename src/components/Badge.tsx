import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, BorderRadius, Spacing, Typography } from "../constants/theme";

interface BadgeProps {
  label: string;
  type?: "primary" | "accent" | "business" | "success" | "warning" | "danger";
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, type = "primary", style }) => {
  const getColorScheme = () => {
    switch (type) {
      case "accent":
        return { bg: Colors.accentLight, text: Colors.accent };
      case "business":
        return { bg: "#EEF1FD", text: Colors.businessTag };
      case "success":
        return { bg: "#E6F5ED", text: Colors.success };
      case "warning":
        return { bg: "#FDF4E7", text: Colors.warning };
      case "danger":
        return { bg: "#FDEAEA", text: Colors.danger };
      default:
        return { bg: Colors.primaryLight, text: Colors.primary };
    }
  };

  const scheme = getColorScheme();

  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg }, style]}>
      <Text style={[styles.badgeText, { color: scheme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
