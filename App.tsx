import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation";
import { getDatabase } from "./src/db";
import { useAppStore } from "./src/store/useAppStore";
import { LockScreen } from "./src/features/security/screens/LockScreen";

export default function App() {
  const isLocked = useAppStore((s) => s.isLocked);
  const lockEnabled = useAppStore((s) => s.lockEnabled);
  const pinHash = useAppStore((s) => s.pinHash);
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const unlock = useAppStore((s) => s.unlock);
  const fetchInitialData = useAppStore((s) => s.fetchInitialData);

  useEffect(() => {
    // Khởi tạo database SQLite, chạy migrations, tải dữ liệu + cài đặt khóa
    getDatabase()
      .then(() => fetchInitialData())
      .catch((err) => console.error("Database initialization error:", err));
  }, [fetchInitialData]);

  const showLock = lockEnabled && isLocked && pinHash;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {showLock ? (
          <LockScreen pinHash={pinHash} biometricEnabled={biometricEnabled} onUnlock={unlock} />
        ) : (
          <RootNavigator />
        )}
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
