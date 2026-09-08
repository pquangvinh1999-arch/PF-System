import { Platform } from "react-native";

export interface PwaStatus {
  isWeb: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasServiceWorker: boolean;
  swState: "active" | "installing" | "waiting" | "none";
}

export interface ClearCacheResult {
  success: boolean;
  message: string;
  preservedIdentity: boolean;
  preservedUserData: boolean;
}

/**
 * Lấy trạng thái hoạt động của PWA
 */
export function getPwaStatus(): PwaStatus {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return {
      isWeb: false,
      isStandalone: false,
      isIOS: false,
      isAndroid: false,
      hasServiceWorker: false,
      swState: "none",
    };
  }

  const ua = window.navigator?.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (window.navigator?.platform === "MacIntel" && window.navigator?.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);

  // Standalone: đã thêm vào màn hình chính trên iOS Safari hoặc WebAPK/PWA Android
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (window.navigator as any)?.standalone === true ||
    document.referrer.includes("android-app://");

  const hasServiceWorker = "serviceWorker" in window.navigator;
  let swState: PwaStatus["swState"] = "none";

  if (hasServiceWorker && window.navigator.serviceWorker.controller) {
    swState = "active";
  }

  return {
    isWeb: true,
    isStandalone,
    isIOS,
    isAndroid,
    hasServiceWorker,
    swState,
  };
}

/**
 * THUẬT TOÁN XÓA CACHE AN TOÀN TRÊN CLIENT (Safe Cache Clearing Client-side)
 * 
 * Nguyên tắc bảo vệ:
 * 1. BẢO VỆ 100% ICON: Không bao giờ xóa vùng cache 'ven-pwa-identity-v1' (apple-touch-icon, manifest.json, splash).
 * 2. BẢO VỆ DỮ LIỆU TÀI CHÍNH: Tuyệt đối KHÔNG xóa IndexedDB (chứa wa-sqlite ven_finance.db) và localStorage bảo mật.
 * 3. XÓA BỘ NHỚ LỖI THỜI: Xóa dynamic cache, shell cache cũ và bộ nhớ tạm sessionStorage.
 * 4. TÁI TẠO BẢN ĐỆM ICON: Kiểm tra và làm ấm lại các icon nhận diện trước khi hoàn tất.
 */
export async function safeClearAppCache(options: { reloadAfter?: boolean } = {}): Promise<ClearCacheResult> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return {
      success: true,
      message: "Thiết bị Native không sử dụng web cache storage.",
      preservedIdentity: true,
      preservedUserData: true,
    };
  }

  try {
    // 1. Gửi thông điệp SAFE_CLEAR_CACHE tới Service Worker nếu có
    if ("serviceWorker" in window.navigator && window.navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const messageChannel = new MessageChannel();
        const timeout = setTimeout(() => resolve(), 2000); // 2s fallback timeout

        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          console.log("[PWA SafeCache] Service worker xác nhận dọn cache an toàn:", event.data);
          resolve();
        };

        window.navigator.serviceWorker.controller?.postMessage(
          { type: "SAFE_CLEAR_CACHE" },
          [messageChannel.port2]
        );
      });
    }

    // 2. Tự dọn dẹp trực tiếp trong CacheStorage của trình duyệt (với bộ lọc bảo vệ)
    if ("caches" in window) {
      const keys = await window.caches.keys();
      for (const key of keys) {
        // NGUYÊN TẮC: BẢO VỆ IDENTITY CACHE CHO SAFARI & APK
        if (key.includes("identity") || key === "ven-pwa-identity-v1") {
          console.log(`[PWA SafeCache] 🛡️ Bảo vệ vùng cache nhận diện: ${key}`);
          continue;
        }

        // Chỉ xóa shell hoặc dynamic caches
        if (key.startsWith("ven-pwa-shell") || key.startsWith("ven-pwa-dynamic")) {
          console.log(`[PWA SafeCache] 🗑️ Đang xóa cache cũ: ${key}`);
          await window.caches.delete(key);
        }
      }

      // Đảm bảo nạp lại icon nhận diện vào Cache
      try {
        const idCache = await window.caches.open("ven-pwa-identity-v1");
        const criticalIcons = ["/apple-touch-icon.png", "/manifest.json", "/favicon.ico"];
        await Promise.allSettled(criticalIcons.map((i) => idCache.add(i)));
      } catch (e) {
        // Bỏ qua nếu offline
      }
    }

    // 3. Xóa sessionStorage tạm thời (không ảnh hưởng dữ liệu tài chính vĩnh viễn)
    try {
      window.sessionStorage?.clear();
    } catch (e) {
      // Bỏ qua nếu bị chặn
    }

    // 4. Nạp lại trang nếu có yêu cầu (để nhận mã nguồn JS mới nhất)
    if (options.reloadAfter) {
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }

    return {
      success: true,
      message: "Đã xóa sạch cache lỗi thời! Đã bảo vệ nguyên vẹn Icon màn hình chính & Dữ liệu tài chính.",
      preservedIdentity: true,
      preservedUserData: true,
    };
  } catch (error: any) {
    console.error("[PWA SafeCache] Lỗi khi dọn dẹp cache:", error);
    return {
      success: false,
      message: `Lỗi: ${error?.message || "Không thể dọn dẹp cache"}`,
      preservedIdentity: true,
      preservedUserData: true,
    };
  }
}
