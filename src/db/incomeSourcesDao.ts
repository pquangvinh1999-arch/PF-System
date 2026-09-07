import { getDatabase } from "./index";
import { IncomeSource, IncomeSourceType, FrequencyType } from "../types";

export const IncomeSourcesDao = {
  async getByUserId(userId: string): Promise<IncomeSource[]> {
    const db = await getDatabase();
    return await db.getAllAsync<IncomeSource>(
      "SELECT * FROM income_sources WHERE user_id = ? ORDER BY created_at ASC;",
      [userId]
    );
  },

  async create(
    userId: string,
    name: string,
    type: IncomeSourceType,
    amount: number,
    frequency: FrequencyType = "monthly",
    date?: string
  ): Promise<IncomeSource> {
    const db = await getDatabase();
    const id = "inc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const createdAt = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO income_sources (id, user_id, name, type, amount, frequency, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      [id, userId, name, type, amount, frequency, date || "", createdAt]
    );
    return { id, user_id: userId, name, type, amount, frequency, date, created_at: createdAt };
  },
};
