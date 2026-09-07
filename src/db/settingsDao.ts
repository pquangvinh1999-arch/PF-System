import { getDatabase } from "./index";

export const SettingsDao = {
  async get(key: string): Promise<string | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?;`,
      [key]
    );
    return row ? String(row.value) : null;
  },

  async set(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, value, now]
    );
  },

  async remove(key: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM app_settings WHERE key = ?;`, [key]);
  },
};

export const SETTINGS_KEYS = {
  pinHash: "lock.pin_hash",
  lockEnabled: "lock.enabled",
  biometricEnabled: "lock.biometric_enabled",
} as const;
