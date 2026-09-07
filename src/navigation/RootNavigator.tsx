import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { OnboardingScreen } from "../features/onboarding/screens/OnboardingScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../constants/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isOnboarded, isLoading, fetchInitialData } = useAppStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isOnboarded ? "MainTabs" : "Onboarding"}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});
