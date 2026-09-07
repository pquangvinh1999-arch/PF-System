import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card, Button, Badge } from "../../../components";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { RootStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.logo}>Vén</Text>
          <Text style={styles.tagline}>Vén khéo dòng tiền của bạn</Text>
          <Badge label="Chào mừng" type="accent" style={styles.badge} />
          <Text style={styles.description}>
            Giải pháp quản lý tài chính cá nhân và dòng tiền kinh doanh thông minh.
          </Text>
          <Button
            title="Bắt đầu ngay"
            variant="primary"
            style={styles.button}
            onPress={() => navigation.replace("MainTabs", { screen: "Dashboard" })}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    padding: Spacing.xxl,
  },
  logo: {
    ...Typography.h1,
    fontSize: 42,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  badge: {
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  button: {
    width: "100%",
  },
});
