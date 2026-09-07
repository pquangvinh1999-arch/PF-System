import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Card, Badge } from "../../../components";
import { Colors, Spacing, Typography } from "../../../constants/theme";

export const AccountsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Badge label="Cá nhân · Kinh doanh" type="business" style={styles.badge} />
          <Text style={styles.title}>Tài khoản & Ví</Text>
          <Text style={styles.desc}>
            Màn hình Tài khoản & Ví theo hệ thống thiết kế Vén.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    padding: Spacing.lg,
  },
  card: {
    padding: Spacing.xl,
  },
  badge: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  desc: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
});
