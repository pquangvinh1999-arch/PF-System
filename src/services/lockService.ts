/**
 * Task 7.1 — PIN + hash nội bộ (không lưu plaintext).
 * Dùng FNV-1a 32-bit nhiều vòng + salt cố định theo app.
 * Ghi chú: đây là bảo vệ mức ứng dụng local (chống xem lén),
 * không thay thế Keychain/Keystore — khi có thiết bị thật nên
 * bật sinh trắc học (expo-local-authentication) làm lớp chính.
 */

const SALT = "ven-pin-v1";

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const LockService = {
  validatePinFormat(pin: string): { ok: boolean; error?: string } {
    const clean = String(pin ?? "").trim();
    if (!/^\d{4,6}$/.test(clean)) {
      return { ok: false, error: "Mã PIN gồm 4–6 chữ số" };
    }
    // Chặn PIN yếu phổ biến
    const weak = ["0000", "1111", "1234", "4321", "000000", "123456", "654321"];
    if (weak.includes(clean)) {
      return { ok: false, error: "PIN quá dễ đoán, hãy chọn mã khác" };
    }
    // Chặn toàn số giống nhau (0000 đã chặn, còn 2222, 999999...)
    if (/^(\d)\1+$/.test(clean)) {
      return { ok: false, error: "PIN quá dễ đoán, hãy chọn mã khác" };
    }
    return { ok: true };
  },

  hashPin(pin: string): string {
    let h = `${SALT}:${String(pin).trim()}`;
    // 1000 vòng để tăng chi phí brute-force cơ bản
    let acc = "";
    for (let round = 0; round < 1000; round++) {
      const n = fnv1a(`${round}:${h}`);
      h = n.toString(16).padStart(8, "0") + h.substring(0, 24);
      if (round % 250 === 0) acc += n.toString(16);
    }
    return `fnv1k$${acc}$${fnv1a(h).toString(16)}`;
  },

  verifyPin(pin: string, hash: string): boolean {
    try {
      return this.hashPin(pin) === hash;
    } catch {
      return false;
    }
  },
};
