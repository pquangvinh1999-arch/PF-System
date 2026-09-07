import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation";
import { getDatabase } from "./src/db";

export default function App() {
  useEffect(() => {
    // Khởi tạo database SQLite và chạy migrations khi mở app
    getDatabase().catch((err) => console.error("Database initialization error:", err));
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
