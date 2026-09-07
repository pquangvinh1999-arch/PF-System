import * as SQLite from "expo-sqlite";
import { INITIAL_MIGRATION_SQL } from "./schema";

export interface Migration {
  version: number;
  name: string;
  sql: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial_core_schema",
    sql: INITIAL_MIGRATION_SQL,
  },
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Đảm bảo bảng quản lý migration tồn tại
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // Lấy danh sách các version đã chạy
  const appliedMigrations = await db.getAllAsync<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version ASC;"
  );
  const appliedVersions = new Set(appliedMigrations.map((m) => m.version));

  // Thực thi tuần tự các migration chưa áp dụng
  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[DB Migration] Applying migration v${migration.version}: ${migration.name}`);
      for (const statement of migration.sql) {
        await db.execAsync(statement);
      }
      await db.runAsync(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);",
        [migration.version, migration.name, new Date().toISOString()]
      );
      console.log(`[DB Migration] Migration v${migration.version} applied successfully.`);
    }
  }
}
