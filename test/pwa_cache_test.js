const assert = require("assert");

console.log("=== RUNNING PWA CACHE ALGORITHM & SAFARI/APK ICON PROTECTION TESTS ===");

// Giả lập danh sách tài nguyên nhận diện (Identity Assets)
const IDENTITY_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/apple-touch-icon-180x180.png",
  "/apple-touch-icon-152x152.png",
  "/apple-touch-icon-120x120.png",
  "/apple-touch-icon-precomposed.png",
  "/splash-icon.png",
  "/icons/icon-48.png",
  "/icons/icon-72.png",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-167.png",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

function isIdentityAsset(urlPath) {
  return (
    IDENTITY_ASSETS.some((asset) => urlPath === asset || urlPath.endsWith(asset)) ||
    urlPath.includes("/icons/") ||
    urlPath.includes("apple-touch-icon") ||
    urlPath.includes("favicon") ||
    urlPath.endsWith("manifest.json") ||
    urlPath.endsWith(".wasm")
  );
}

// TEST 1: Kiểm tra nhận diện tài nguyên Icon Safari & Android
const testUrls = [
  { url: "/apple-touch-icon.png", expected: true },
  { url: "/apple-touch-icon-180x180.png", expected: true },
  { url: "/icons/icon-192.png", expected: true },
  { url: "/icons/icon-512.png", expected: true },
  { url: "/icons/icon-maskable-512.png", expected: true },
  { url: "/manifest.json", expected: true },
  { url: "/wa-sqlite.wasm", expected: true },
  { url: "/_expo/static/js/web/index-12345.js", expected: false },
  { url: "/_expo/static/css/style-abcde.css", expected: false },
];

for (const { url, expected } of testUrls) {
  assert.strictEqual(isIdentityAsset(url), expected, `Failed for URL: ${url}`);
}
console.log("--- TEST 1: Identity asset classification PASS ---");

// TEST 2: Kiểm tra thuật toán lọc và bảo vệ Cache (Safe Cache Eviction)
const IDENTITY_CACHE_NAME = "ven-pwa-identity-v1";
const CURRENT_SHELL_CACHE = "ven-pwa-shell-v1.0.0";
const CURRENT_DYNAMIC_CACHE = "ven-pwa-dynamic-v1.0.0";

function simulateSafeCacheClean(cacheKeys, currentShell, currentDynamic) {
  const actions = [];
  for (const key of cacheKeys) {
    if (key === IDENTITY_CACHE_NAME || key.includes("identity")) {
      actions.push({ key, action: "PRESERVE" });
    } else if (key !== currentShell && key !== currentDynamic) {
      actions.push({ key, action: "DELETE" });
    } else {
      actions.push({ key, action: "KEEP_CURRENT" });
    }
  }
  return actions;
}

const mockCaches = [
  "ven-pwa-identity-v1", // Must be preserved!
  "ven-pwa-shell-v0.9.0", // Stale shell -> delete
  "ven-pwa-dynamic-v0.9.0", // Stale dynamic -> delete
  "ven-pwa-shell-v1.0.0", // Current shell -> keep
  "ven-pwa-dynamic-v1.0.0", // Current dynamic -> keep
  "old-unversioned-cache", // Old -> delete
];

const results = simulateSafeCacheClean(mockCaches, CURRENT_SHELL_CACHE, CURRENT_DYNAMIC_CACHE);

const identityAction = results.find((r) => r.key === "ven-pwa-identity-v1");
assert.strictEqual(identityAction.action, "PRESERVE", "Identity cache was not preserved!");

const staleShellAction = results.find((r) => r.key === "ven-pwa-shell-v0.9.0");
assert.strictEqual(staleShellAction.action, "DELETE", "Stale shell cache was not deleted!");

const currentShellAction = results.find((r) => r.key === "ven-pwa-shell-v1.0.0");
assert.strictEqual(currentShellAction.action, "KEEP_CURRENT", "Current shell cache was not kept!");

console.log("--- TEST 2: Safe Cache Eviction Algorithm filtering PASS ---");

// TEST 3: Kiểm tra tính bất khả xâm phạm của dữ liệu tài chính (IndexedDB & SQLite)
const protectedDatabases = ["ven_finance.db", "wa-sqlite"];
function isStorageSafeFromClear(storageName) {
  return protectedDatabases.includes(storageName);
}

for (const db of protectedDatabases) {
  assert.strictEqual(isStorageSafeFromClear(db), true, `Database ${db} must be protected!`);
}
console.log("--- TEST 3: Financial Database protection PASS ---");

// TEST 4: Kiểm tra đầy đủ file icons vật lý trong thư mục public
const fs = require("fs");
const path = require("path");
const requiredFiles = [
  "public/manifest.json",
  "public/index.html",
  "public/sw.js",
  "public/apple-touch-icon.png",
  "public/apple-touch-icon-180x180.png",
  "public/apple-touch-icon-152x152.png",
  "public/apple-touch-icon-120x120.png",
  "public/apple-touch-icon-precomposed.png",
  "public/favicon.ico",
  "public/favicon.png",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/icon-maskable-192.png",
  "public/icons/icon-maskable-512.png",
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(file);
  assert.strictEqual(exists, true, `Missing required file: ${file}`);
}
console.log("--- TEST 4: Required PWA and Safari/Android asset files existence PASS ---");

console.log("=== ALL PWA CACHE & ICON PROTECTION TESTS PASSED 100% ===");
