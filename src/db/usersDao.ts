import { getDatabase } from "./index";
import { User } from "../types";

export const UsersDao = {
  async getCurrentUser(): Promise<User | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<User>(
      "SELECT * FROM users ORDER BY created_at ASC LIMIT 1;"
    );
    return result || null;
  },

  async createUser(name: string, currency = "VND"): Promise<User> {
    const db = await getDatabase();
    const id = "usr_" + Date.now();
    const createdAt = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO users (id, name, currency, created_at) VALUES (?, ?, ?, ?);",
      [id, name, currency, createdAt]
    );
    return { id, name, currency, created_at: createdAt };
  },
};
