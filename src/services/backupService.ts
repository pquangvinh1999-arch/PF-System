/**
 * Task 7.3 — Backup/Restore local (không thêm lib ngoài).
 * - Serialize toàn bộ state thành JSON có version.
 * - Mã hóa XOR + base64 bằng passphrase (mặc định dùng PIN) để
 *   file backup KHÔNG ở dạng plaintext đọc được ngay (đúng SKILLS Nhóm I).
 * - Lưu ý minh bạch: đây là mã hóa che giấu mức ứng dụng, không phải
 *   AES chuẩn — phù hợp backup cá nhân, không dùng cho dữ liệu cực nhạy.
 */

export const BACKUP_VERSION = 1;
const PREFIX = "VEN1.";

function nodeBuffer(): any {
  return (globalThis as any).Buffer;
}

function toBase64(str: string): string {
  // RN Hermes có sẵn btoa/atob; fallback cho Node test
  if (typeof (globalThis as any).btoa === "function") {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return (globalThis as any).btoa(bin);
  }
  return nodeBuffer().from(str, "utf8").toString("base64");
}

function fromBase64(b64: string): string {
  if (typeof (globalThis as any).atob === "function") {
    const bin: string = (globalThis as any).atob(b64);
    const bytes = Uint8Array.from(bin, (c: string) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return nodeBuffer().from(b64, "base64").toString("utf8");
}

function xorCrypt(text: string, key: string): string {
  const k = key || "ven-default";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ k.charCodeAt(i % k.length));
  }
  return out;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  app: string;
  data: Record<string, unknown[] | unknown>;
}

export const BackupService = {
  serialize(state: {
    user: unknown;
    incomeSources: unknown[];
    accounts: unknown[];
    transactions: unknown[];
    budgets: unknown[];
    profitFirstRules: unknown[];
    plannedExpenses: unknown[];
    goals: unknown[];
    debts: unknown[];
  }): BackupPayload {
    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      app: "ven-finance",
      data: {
        users: state.user ? [state.user] : [],
        income_sources: state.incomeSources,
        accounts: state.accounts,
        transactions: state.transactions,
        budgets: state.budgets,
        profit_first_rules: state.profitFirstRules,
        planned_expenses: state.plannedExpenses,
        goals: state.goals,
        debts: state.debts,
      },
    };
  },

  encrypt(payload: BackupPayload, passphrase: string): string {
    if (!passphrase || passphrase.length < 4) {
      throw new Error("Passphrase phải có ít nhất 4 ký tự (nên dùng mã PIN của bạn)");
    }
    const json = JSON.stringify(payload);
    return PREFIX + toBase64(xorCrypt(json, passphrase));
  },

  decrypt(blob: string, passphrase: string): BackupPayload {
    const clean = String(blob ?? "").trim();
    if (!clean.startsWith(PREFIX)) throw new Error("File backup không đúng định dạng Vén");
    let json = "";
    try {
      json = xorCrypt(fromBase64(clean.substring(PREFIX.length)), passphrase);
    } catch {
      throw new Error("Không đọc được file backup (sai passphrase?)");
    }
    let obj: any;
    try {
      obj = JSON.parse(json);
    } catch {
      throw new Error("Sai passphrase hoặc file backup đã hỏng");
    }
    const check = this.validate(obj);
    if (!check.ok) throw new Error(check.error);
    return obj as BackupPayload;
  },

  validate(obj: any): { ok: boolean; error?: string } {
    if (!obj || typeof obj !== "object") return { ok: false, error: "Dữ liệu backup rỗng" };
    if (obj.app !== "ven-finance") return { ok: false, error: "Không phải file backup của Vén" };
    if (obj.version !== BACKUP_VERSION)
      return { ok: false, error: `Phiên bản backup không hỗ trợ (v${obj.version})` };
    if (!obj.data || typeof obj.data !== "object")
      return { ok: false, error: "Thiếu khối dữ liệu trong backup" };
    return { ok: true };
  },

  isPlaintextLeak(blob: string, sampleAmount: string): boolean {
    // Kiểm tra backup KHÔNG lộ số tiền dạng plaintext
    return blob.includes(sampleAmount);
  },
};
