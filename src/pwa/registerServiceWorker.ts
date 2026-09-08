import { Platform } from "react-native";

export function registerServiceWorker() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in window.navigator)) {
    console.log("[PWA] Trình duyệt hiện tại không hỗ trợ Service Worker.");
    return;
  }

  window.addEventListener("load", () => {
    window.navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[PWA] Service Worker đăng ký thành công:", registration.scope);

        // Kiểm tra phiên bản mới định kỳ (mỗi 30 phút)
        setInterval(() => {
          registration.update().catch((e) => console.log("[PWA] Lỗi kiểm tra update định kỳ:", e));
        }, 30 * 60 * 1000);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (window.navigator.serviceWorker.controller) {
                console.log("[PWA] Đã tải xong phiên bản cập nhật mới.");
                window.dispatchEvent(new CustomEvent("pwa-update-available"));
              } else {
                console.log("[PWA] Dữ liệu offline đã được lưu.");
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn("[PWA] Không thể đăng ký Service Worker:", error);
      });
  });
}
