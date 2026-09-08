/**
 * Vén Finance - PWA Service Worker
 * Tích hợp thuật toán bảo vệ Icon màn hình chính (Safari WebClip & Android APK/WebAPK)
 * & Thuật toán xóa cache an toàn (Safe Cache Cleaner)
 */

const PWA_VERSION = 'v1.0.0';

// 1. Tên các vùng Cache riêng biệt
// IDENTITY_CACHE: Vùng BẤT BIẾN lưu giữ Icon, Manifest, Splash - TUYỆT ĐỐI KHÔNG BỊ XÓA khi clear cache
const IDENTITY_CACHE_NAME = 'ven-pwa-identity-v1';
// SHELL_CACHE: Mã nguồn ứng dụng (HTML, JS bundles)
const SHELL_CACHE_NAME = `ven-pwa-shell-${PWA_VERSION}`;
// DYNAMIC_CACHE: Dữ liệu động, tài nguyên tạm
const DYNAMIC_CACHE_NAME = `ven-pwa-dynamic-${PWA_VERSION}`;

// Danh sách tài nguyên nhận diện (Identity Assets) bắt buộc phải bảo vệ cho Safari & APK
const IDENTITY_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-180x180.png',
  '/apple-touch-icon-152x152.png',
  '/apple-touch-icon-120x120.png',
  '/apple-touch-icon-precomposed.png',
  '/splash-icon.png',
  '/icons/icon-48.png',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-167.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png'
];

/**
 * Kiểm tra xem một request URL có thuộc nhóm nhận diện hệ thống (Identity Asset) không.
 * Các file này quyết định icon hiển thị ở màn hình chính Safari & Android.
 */
function isIdentityAsset(url) {
  const pathname = url.pathname;
  return (
    IDENTITY_ASSETS.some(asset => pathname === asset || pathname.endsWith(asset)) ||
    pathname.includes('/icons/') ||
    pathname.includes('apple-touch-icon') ||
    pathname.includes('favicon') ||
    pathname.endsWith('manifest.json') ||
    pathname.endsWith('.wasm')
  );
}

/**
 * THUẬT TOÁN XÓA CACHE AN TOÀN (Safe Cache Eviction Algorithm)
 * 1. Quét toàn bộ danh sách cache hiện có trong CacheStorage.
 * 2. Bảo vệ nghiêm ngặt IDENTITY_CACHE (không chạm vào icon, manifest).
 * 3. Xóa các cache code/bundle cũ lỗi thời của các phiên bản trước.
 * 4. Tự động kiểm tra và làm ấm (re-warm) lại bộ icon để đảm bảo Safari WebClip luôn hợp lệ.
 */
async function safeClearCaches(options = { preserveIdentity: true, forceRevalidateIcons: true }) {
  console.log('[SW CacheCleaner] Bắt đầu thuật toán dọn dẹp cache an toàn...');
  const cacheKeys = await caches.keys();
  
  const deletionResults = await Promise.all(
    cacheKeys.map(async (key) => {
      // BẢO VỆ: Không bao giờ xóa vùng nhận diện Icon & Manifest
      if (options.preserveIdentity && (key === IDENTITY_CACHE_NAME || key.includes('identity'))) {
        console.log(`[SW CacheCleaner] 🛡️ Bảo vệ vùng cache nhận diện: ${key}`);
        return { key, status: 'preserved' };
      }

      // Xóa các cache phiên bản cũ không trùng với phiên bản hiện tại
      if (key !== SHELL_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
        console.log(`[SW CacheCleaner] 🗑️ Đang xóa cache lỗi thời: ${key}`);
        await caches.delete(key);
        return { key, status: 'deleted' };
      }

      return { key, status: 'kept_current' };
    })
  );

  // Tái xác thực và làm ấm lại các icon nếu cần
  if (options.forceRevalidateIcons) {
    try {
      const identityCache = await caches.open(IDENTITY_CACHE_NAME);
      for (const asset of IDENTITY_ASSETS) {
        const cached = await identityCache.match(asset);
        if (!cached) {
          try {
            await identityCache.add(asset);
            console.log(`[SW CacheCleaner] ✅ Đã nạp bổ sung icon: ${asset}`);
          } catch (err) {
            // Tiếp tục với các icon khác nếu 1 cái chưa sẵn sàng
          }
        }
      }
    } catch (e) {
      console.warn('[SW CacheCleaner] Lỗi khi tái xác thực icon:', e);
    }
  }

  console.log('[SW CacheCleaner] Hoàn tất dọn dẹp cache an toàn.', deletionResults);
  return deletionResults;
}

// SỰ KIỆN: Install Service Worker
self.addEventListener('install', (event) => {
  console.log(`[SW] Đang cài đặt Service Worker ${PWA_VERSION}...`);
  event.waitUntil(
    (async () => {
      // 1. Precache toàn bộ Icon & Manifest vào IDENTITY_CACHE
      const identityCache = await caches.open(IDENTITY_CACHE_NAME);
      await Promise.allSettled(
        IDENTITY_ASSETS.map((asset) =>
          identityCache.add(asset).catch((err) => {
            console.warn(`[SW Install] Không thể tải trước ${asset}:`, err);
          })
        )
      );

      // 2. Precache trang chủ vào Shell Cache
      const shellCache = await caches.open(SHELL_CACHE_NAME);
      try {
        await shellCache.add('/');
      } catch (e) {
        console.warn('[SW Install] Không thể tải trước root:', e);
      }

      // Kích hoạt ngay lập tức mà không phải chờ đóng tab cũ
      await self.skipWaiting();
    })()
  );
});

// SỰ KIỆN: Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log(`[SW] Kích hoạt Service Worker ${PWA_VERSION}...`);
  event.waitUntil(
    (async () => {
      // Chạy thuật toán xóa cache an toàn ngay khi kích hoạt
      await safeClearCaches({ preserveIdentity: true, forceRevalidateIcons: true });
      // Chiếm quyền điều khiển ngay lập tức cho tất cả client tabs đang mở
      await self.clients.claim();
    })()
  );
});

// SỰ KIỆN: Fetch Requests
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bỏ qua các scheme không phải HTTP/HTTPS (vd: chrome-extension, file)
  if (!url.protocol.startsWith('http')) return;

  // 1. CHIẾN LƯỢC CHO ICON, MANIFEST, SPLASH (IDENTITY ASSETS):
  // Cache-First với Background Revalidation
  // => Đảm bảo Safari và Android WebAPK LUÔN LUÔN nhận được icon ngay tức khắc (0ms), không bao giờ bị 404 hay trắng màn hình!
  if (isIdentityAsset(url)) {
    event.respondWith(
      (async () => {
        const identityCache = await caches.open(IDENTITY_CACHE_NAME);
        const cachedResponse = await identityCache.match(request);

        // Nền: Tự động cập nhật bản mới từ mạng
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              identityCache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        // Nếu đã có trong cache: trả về ngay lập tức
        if (cachedResponse) {
          return cachedResponse;
        }

        // Nếu chưa có trong cache: đợi mạng
        const netResp = await fetchPromise;
        if (netResp) return netResp;

        // Fallback khẩn cấp nếu offline và không tìm thấy: Trả về icon apple-touch gốc
        const fallback = await identityCache.match('/apple-touch-icon.png');
        if (fallback) return fallback;

        return new Response('Icon not found', { status: 404 });
      })()
    );
    return;
  }

  // 2. CHIẾN LƯỢC CHO TRANG CHÍNH NAVIGATION (HTML):
  // Network-First với Offline Fallback
  // => Ưu tiên cập nhật phiên bản ứng dụng mới nhất, nếu mất mạng thì mở trang đã lưu trong cache
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const shellCache = await caches.open(SHELL_CACHE_NAME);
            shellCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log('[SW] Ngoại tuyến: Đang nạp trang từ bộ nhớ cache...');
          const shellCache = await caches.open(SHELL_CACHE_NAME);
          const cached = await shellCache.match(request);
          if (cached) return cached;
          const rootCached = await shellCache.match('/');
          if (rootCached) return rootCached;
          const idFallback = await caches.match('/');
          if (idFallback) return idFallback;
          throw error;
        }
      })()
    );
    return;
  }

  // 3. CHIẾN LƯỢC CHO JS, CSS, BUNDLES METRO:
  // Stale-While-Revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const cachedResponse = await cache.match(request);

      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || (await fetchPromise);
    })()
  );
});

// SỰ KIỆN: Lắng nghe thông điệp từ ứng dụng (Client PostMessage)
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Lệnh xóa cache an toàn từ giao diện người dùng
  if (data.type === 'SAFE_CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const results = await safeClearCaches({
          preserveIdentity: true,
          forceRevalidateIcons: true
        });
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            success: true,
            version: PWA_VERSION,
            results
          });
        }
      })()
    );
  }

  if (data.type === 'GET_PWA_INFO') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: PWA_VERSION,
        identityCache: IDENTITY_CACHE_NAME,
        shellCache: SHELL_CACHE_NAME,
        dynamicCache: DYNAMIC_CACHE_NAME
      });
    }
  }
});
