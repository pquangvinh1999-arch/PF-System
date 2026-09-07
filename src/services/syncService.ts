/**
 * Task 7.2 — Đồng bộ cloud (TÙY CHỌN, abstraction sẵn sàng).
 *
 * Trạng thái: CHƯA cấu hình provider thật (cần user cung cấp
 * Firebase/Supabase project + API keys — thao tác tốn phí/rủi ro
 * theo setting.json nên KHÔNG tự tạo). Code dưới đây là khung
 * interface + provider local (no-op) để khi user sẵn sàng chỉ
 * cần cắm config mà không phải sửa màn hình nào.
 */

import { BackupPayload, BackupService } from "./backupService";

export interface SyncProvider {
  readonly name: string;
  isConfigured(): boolean;
  configure(config: Record<string, string>): void;
  push(payload: BackupPayload): Promise<{ ok: boolean; message: string }>;
  pull(): Promise<{ ok: boolean; payload: BackupPayload | null; message: string }>;
}

export class LocalOnlySyncProvider implements SyncProvider {
  readonly name = "local-only";
  isConfigured(): boolean {
    return true;
  }
  configure(): void {
    // không cần config
  }
  async push(_payload?: BackupPayload): Promise<{ ok: boolean; message: string }> {
    void _payload;
    return { ok: false, message: "Chưa cấu hình cloud — dữ liệu chỉ lưu local (đúng mặc định Giai đoạn 1)." };
  }
  async pull(): Promise<{ ok: boolean; payload: BackupPayload | null; message: string }> {
    return { ok: true, payload: null, message: "Chưa cấu hình cloud — không có gì để tải về." };
  }
}

export class AwaitingConfigSyncProvider implements SyncProvider {
  readonly name: string;
  private config: Record<string, string> | null = null;
  constructor(name: "firebase" | "supabase") {
    this.name = name;
  }
  isConfigured(): boolean {
    return Boolean(this.config?.apiKey && this.config?.projectId);
  }
  configure(config: Record<string, string>): void {
    this.config = config;
  }
  async push(payload: BackupPayload): Promise<{ ok: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: `Chưa có API key ${this.name} — hãy dán config trong Cài đặt để bật đồng bộ 2 vợ chồng cùng xem ví gia đình.`,
      };
    }
    void payload;
    return { ok: false, message: "Provider đã cấu hình nhưng client mạng chưa được cài (cần user duyệt thêm lib)." };
  }
  async pull(): Promise<{ ok: boolean; payload: BackupPayload | null; message: string }> {
    if (!this.isConfigured()) {
      return { ok: false, payload: null, message: `Chưa có API key ${this.name}.` };
    }
    return { ok: false, payload: null, message: "Provider đã cấu hình nhưng client mạng chưa được cài (cần user duyệt thêm lib)." };
  }
}

export const SyncService = {
  local: new LocalOnlySyncProvider(),
  firebase: new AwaitingConfigSyncProvider("firebase"),
  supabase: new AwaitingConfigSyncProvider("supabase"),

  buildShareText(payload: BackupPayload, passphrase: string): string {
    // Tái dùng backup mã hóa để 2 máy quét/chép tay cho nhau (đồng bộ thủ công, không cloud)
    return BackupService.encrypt(payload, passphrase);
  },
};
