import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";

export const DB_NAME = "ven_finance.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    // Bật hỗ trợ Foreign Keys trong SQLite
    await dbInstance.execAsync("PRAGMA foreign_keys = ON;");
    await runMigrations(dbInstance);
  }
  return dbInstance;
}

export * from "./schema";
export * from "./migrations";
