import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { getPwaStatus } from "../../../pwa/cacheManager";

interface Props {
  onDownloadComplete: () => void;
}

export const PwaInstallLandingScreen: React.FC<Props> = ({ onDownloadComplete }) => {
  const [pwaStatus, setPwaStatus] = useState(getPwaStatus);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [canPromptAndroid, setCanPromptAndroid] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "completed">("idle");
  const [progress, setProgress] = useState(0);
  const [statusNote, setStatusNote] = useState("Sẵn sàng tải về");
  const downloadTimerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    // Cập nhật trạng thái PWA
    setPwaStatus(getPwaStatus());

    // Bắt sự kiện beforeinstallprompt trên Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setCanPromptAndroid(true);
      console.log("[PWA Landing] Đã sẵn sàng sự kiện cài đặt trước (beforeinstallprompt)");
    };

    // Bắt sự kiện appinstalled
    const handleAppInstalled = () => {
      (window as any).deferredInstallPrompt = null;
      setProgress(100);
      setStatusNote("Cài đặt thành công!");
      setDownloadState("completed");
      console.log("[PWA Landing] Ứng dụng đã được cài đặt thành công!");
      setTimeout(() => {
        onDownloadComplete();
      }, 800);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if ((window as any).deferredInstallPrompt) {
      setCanPromptAndroid(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);
    };
  }, [onDownloadComplete]);

  // Kích hoạt tải file shortcut vật lý trên trình duyệt
  const triggerBrowserFileDownload = () => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    try {
      const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Tài Chính Nhà Bơ - Phím Tắt Khởi Động</title>
  <meta http-equiv="refresh" content="0;url=${window.location.origin}">
</head>
<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
  <h2>🥑 Tài Chính Nhà Bơ</h2>
  <p>Đang chuyển hướng vào hệ thống quản lý tài chính...</p>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TaiChinhNhaBo-App.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.warn("Không thể kích hoạt file download:", e);
    }
  };

  // Quá trình tải app & tiến trình 0% -> 100%
  const startDownloadSimulation = (onFinish?: () => void) => {
    setDownloadState("downloading");
    setProgress(15);
    setStatusNote("Đang nạp bộ đệm ứng dụng...");
    triggerBrowserFileDownload();

    let current = 15;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 20) + 15;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setProgress(100);
        setStatusNote("Tải ứng dụng hoàn tất!");
        setDownloadState("completed");
        setTimeout(() => {
          if (onFinish) {
            onFinish();
          } else {
            onDownloadComplete();
          }
        }, 800);
      } else {
        setProgress(current);
        if (current < 40) {
          setStatusNote("Đang tải dữ liệu bộ nhớ đệm...");
        } else if (current < 75) {
          setStatusNote("Đang nạp cơ sở dữ liệu SQLite & hũ Profit First...");
        } else {
          setStatusNote("Đang cấu hình chế độ bảo mật ngoại tuyến...");
        }
      }
    }, 220);

    downloadTimerRef.current = interval;
  };

  const handleInstallPress = async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      onDownloadComplete();
      return;
    }

    // Trường hợp 1: Android / Chrome hỗ trợ deferred prompt
    const promptEvent = (window as any).deferredInstallPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        startDownloadSimulation(() => {
          onDownloadComplete();
        });
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("[PWA Landing] Người dùng đã chấp nhận cài đặt");
        }
        (window as any).deferredInstallPrompt = null;
        setCanPromptAndroid(false);
        return;
      } catch (e) {
        console.warn("Prompt error:", e);
      }
    }

    // Trường hợp 2: iOS Safari
    if (pwaStatus.isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Trường hợp 3: Desktop / Android thường / Trình duyệt bất kỳ
    startDownloadSimulation(() => {
      onDownloadComplete();
    });
  };

  const handleIOSConfirmed = () => {
    setShowIOSModal(false);
    startDownloadSimulation(() => {
      onDownloadComplete();
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoShadow}>
            <Image
              source={require("../../../../assets/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>ỨNG DỤNG TÀI CHÍNH GIA ĐÌNH</Text>
          </View>

          <Text style={styles.appTitle}>Tài Chính Nhà Bơ</Text>
          <Text style={styles.appSubtitle}>
            Hệ thống quản lý tài chính cá nhân & kinh doanh thông minh theo nguyên tắc Profit First
          </Text>
        </View>

        {/* Khối Thông Báo Bảo Mật Yêu Cầu Tải App */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeIcon}>🔒</Text>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Yêu cầu tải app để mở hệ thống</Text>
            <Text style={styles.noticeDesc}>
              Để bảo mật số dư và bảo vệ toàn vẹn dữ liệu cá nhân, hệ thống chỉ hoạt động đầy đủ khi bạn cài đặt ứng dụng về màn hình chính điện thoại.
            </Text>
          </View>
        </View>

        {/* NÚT TẢI APP CHÍNH & TIẾN TRÌNH TẢI */}
        <View style={styles.ctaWrapper}>
          {downloadState === "idle" && (
            <TouchableOpacity
              style={styles.installButton}
              onPress={handleInstallPress}
              activeOpacity={0.88}
            >
              <Text style={styles.installButtonIcon}>📲</Text>
              <View style={styles.installButtonTextCol}>
                <Text style={styles.installButtonTitle}>
                  {canPromptAndroid
                    ? "CÀI ĐẶT ỨNG DỤNG NGAY"
                    : pwaStatus.isIOS
                    ? "TẢI & THÊM VÀO MÀN HÌNH CHÍNH"
                    : "TẢI APP VỀ MÁY"}
                </Text>
                <Text style={styles.installButtonSub}>
                  Nhấn để tải về máy • Mở toàn bộ giao diện hệ thống
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {downloadState === "downloading" && (
            <View style={styles.downloadProgressCard}>
              <View style={styles.progressRow}>
                <ActivityIndicator size="small" color="#0F6E5B" />
                <Text style={styles.progressTitle}>Đang tải ứng dụng ({progress}%)</Text>
              </View>

              {/* Thanh tiến trình */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>

              <Text style={styles.progressStatusNote}>{statusNote}</Text>
            </View>
          )}

          {downloadState === "completed" && (
            <View style={styles.completedCard}>
              <Text style={styles.completedIcon}>✅</Text>
              <Text style={styles.completedTitle}>Tải ứng dụng thành công!</Text>
              <Text style={styles.completedSub}>
                Hệ thống đã sẵn sàng. Đang kích hoạt toàn bộ giao diện...
              </Text>
              <TouchableOpacity
                style={styles.enterSystemBtn}
                onPress={onDownloadComplete}
                activeOpacity={0.85}
              >
                <Text style={styles.enterSystemBtnText}>VÀO HỆ THỐNG NGAY ➔</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Điểm nổi bật của app */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🥑</Text>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Tách bạch 2 Ví độc lập</Text>
              <Text style={styles.featureDesc}>
                Phân định rạch ròi dòng tiền chi tiêu cá nhân và dòng tiền kinh doanh.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>5 Hũ tự động Profit First</Text>
              <Text style={styles.featureDesc}>
                Tự động chia doanh thu thành Lợi nhuận, Thuế, Lương và Chi phí vận hành.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Bảo mật trên máy (Offline SQLite)</Text>
              <Text style={styles.featureDesc}>
                Dữ liệu tài chính nằm an toàn trong máy của bạn, khóa PIN & Face ID.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          Tài Chính Nhà Bơ • Phiên bản 1.0.0 PWA Standalone
        </Text>
      </ScrollView>

      {/* MODAL HƯỚNG DẪN CÀI ĐẶT CHO SAFARI (iOS) VÀ CHROME (ANDROID) */}
      <Modal
        visible={showIOSModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIOSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pwaStatus.isIOS ? "🍎 Cách cài trên iPhone (Safari)" : "🤖 Cách cài trên điện thoại"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowIOSModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {pwaStatus.isIOS ? (
              <View style={styles.stepsContainer}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Bấm vào biểu tượng <Text style={styles.bold}>Chia sẻ (Share ⎋)</Text> ở thanh dưới cùng của Safari.
                  </Text>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Cuộn xuống danh sách và chọn <Text style={styles.bold}>"Thêm vào MH chính" (Add to Home Screen ⊞)</Text>.
                  </Text>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Bấm nút <Text style={styles.bold}>"Thêm" (Add)</Text> ở góc trên bên phải. Icon <Text style={styles.bold}>Tài Chính Nhà Bơ</Text> sẽ xuất hiện trên màn hình điện thoại!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.stepsContainer}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Bấm vào biểu tượng <Text style={styles.bold}>3 chấm (⋮)</Text> ở góc trên bên phải trình duyệt Chrome.
                  </Text>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Chọn dòng <Text style={styles.bold}>"Cài đặt ứng dụng" (Install App)</Text> hoặc <Text style={styles.bold}>"Thêm vào Màn hình chính"</Text>.
                  </Text>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Xác nhận cài đặt. Ứng dụng sẽ xuất hiện như một app độc lập trên máy bạn!
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleIOSConfirmed}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmText}>
                ✅ Tôi đã tải / thêm app (Mở hệ thống)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl * 1.5,
    paddingBottom: Spacing.xxl * 2,
    alignItems: "center",
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoShadow: {
    width: 104,
    height: 104,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  badgeContainer: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F6E5B",
    letterSpacing: 0.8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A2E26",
    marginBottom: 6,
    textAlign: "center",
  },
  appSubtitle: {
    fontSize: 13,
    color: "#5C6F66",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  noticeBox: {
    flexDirection: "row",
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    width: "100%",
    alignItems: "flex-start",
  },
  noticeIcon: {
    fontSize: 22,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B78103",
    marginBottom: 3,
  },
  noticeDesc: {
    fontSize: 12,
    color: "#795548",
    lineHeight: 18,
  },
  ctaWrapper: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  installButton: {
    backgroundColor: "#0F6E5B",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F6E5B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  installButtonIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  installButtonTextCol: {
    flex: 1,
  },
  installButtonTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  installButtonSub: {
    color: "#D0ECE5",
    fontSize: 11,
    marginTop: 2,
  },
  featuresContainer: {
    width: "100%",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E26",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: "#6E8279",
    lineHeight: 17,
  },
  downloadProgressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#0F6E5B33",
    shadowColor: "#0F6E5B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F6E5B",
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: Spacing.sm,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0F6E5B",
    borderRadius: 5,
  },
  progressStatusNote: {
    fontSize: 12,
    color: "#5C6F66",
    fontStyle: "italic",
    marginTop: 2,
  },
  completedCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#A5D6A7",
    alignItems: "center",
  },
  completedIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F6E5B",
    marginBottom: 4,
  },
  completedSub: {
    fontSize: 12,
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  enterSystemBtn: {
    backgroundColor: "#0F6E5B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    width: "100%",
  },
  enterSystemBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  footerText: {
    fontSize: 11,
    color: "#A0AFA9",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2E26",
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#8E9E97",
    fontWeight: "700",
  },
  stepsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0F6E5B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 1,
  },
  stepNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: "#2C3E36",
    lineHeight: 20,
  },
  bold: {
    fontWeight: "700",
    color: "#0F6E5B",
  },
  modalConfirmBtn: {
    backgroundColor: "#0F6E5B",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
