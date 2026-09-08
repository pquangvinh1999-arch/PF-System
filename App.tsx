import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { RootNavigator } from "./src/navigation";
import { getDatabase } from "./src/db";
import { useAppStore } from "./src/store/useAppStore";
import { LockScreen } from "./src/features/security/screens/LockScreen";
import { PwaInstallLandingScreen } from "./src/features/pwa/screens/PwaInstallLandingScreen";
import { getPwaStatus } from "./src/pwa/cacheManager";

export default function App() {
  const isLocked = useAppStore((s) => s.isLocked);
  const lockEnabled = useAppStore((s) => s.lockEnabled);
  const pinHash = useAppStore((s) => s.pinHash);
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const unlock = useAppStore((s) => s.unlock);
  const fetchInitialData = useAppStore((s) => s.fetchInitialData);

  // Trạng thái đã tải app về máy (Lưu vào localStorage sau khi tải thành công)
  const [isAppDownloaded, setIsAppDownloaded] = useState<boolean>(() => {
    if (Platform.OS !== "web") return true;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location?.search || "");
      // Hỗ trợ tham số ?reset=1 hoặc ?download=1 để kiểm thử lại màn hình tải app
      if (urlParams.get("reset") === "1" || urlParams.get("download") === "1") {
        try {
          window.localStorage?.removeItem("nhabo_app_downloaded");
          window.sessionStorage?.removeItem("nhabo_app_downloaded");
        } catch (e) {}
        return false;
      }
      try {
        return (
          window.localStorage?.getItem("nhabo_app_downloaded") === "1" ||
          window.sessionStorage?.getItem("nhabo_app_downloaded") === "1"
        );
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // Kiểm tra chế độ Standalone (khi đã cài đặt app và mở từ màn hình chính)
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (Platform.OS !== "web") return true;
    return getPwaStatus().isStandalone;
  });

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const checkMode = () => {
        setIsStandalone(getPwaStatus().isStandalone);
      };
      checkMode();
      const media = window.matchMedia?.("(display-mode: standalone)");
      media?.addEventListener?.("change", checkMode);
      return () => media?.removeEventListener?.("change", checkMode);
    }
  }, []);

  const hasSystemAccess = Platform.OS !== "web" || isStandalone || isAppDownloaded;

  useEffect(() => {
    // Chỉ khởi tạo database SQLite khi mở app thực tế (Standalone PWA hoặc Native hoặc đã tải app)
    if (hasSystemAccess) {
      getDatabase()
        .then(() => fetchInitialData())
        .catch((err) => console.error("Database initialization error:", err));
    }
  }, [fetchInitialData, hasSystemAccess]);

  // ĐẶC BIỆT: Khi vào bằng Web thông thường (Vercel), CHỈ HIỂN THỊ NÚT TẢI APP.
  // Sau khi tải về thành công mới hiển thị toàn bộ giao diện hệ thống!
  if (!hasSystemAccess) {
    return (
      <SafeAreaProvider>
        <PwaInstallLandingScreen
          onDownloadComplete={() => {
            if (typeof window !== "undefined") {
              try {
                window.localStorage?.setItem("nhabo_app_downloaded", "1");
                window.sessionStorage?.setItem("nhabo_app_downloaded", "1");
              } catch (e) {}
            }
            setIsAppDownloaded(true);
          }}
        />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

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

