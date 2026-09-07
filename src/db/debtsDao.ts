import { getDatabase } from "./index";
import { Debt, DebtStrategy } from "../types";

export type CreateDebtInput = {
  name: string;
  balance: number;
  interest_rate: number;
  min_payment: number;
  strategy?: DebtStrategy;
};

export type UpdateDebtInput = Partial<Omit<Debt, "id" | "created_at">>;

function mapRow(r: any): Debt {
  return {
    id: String(r.id),
    name: String(r.name),
    balance: Number(r.balance),
    interest_rate: Number(r.interest_rate),
    min_payment: Number(r.min_payment),
    strategy: r.strategy as DebtStrategy,
    created_at: String(r.created_at),
  };
}

export const DebtsDao = {
  async getAll(): Promise<Debt[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`SELECT * FROM debts ORDER BY created_at DESC;`);
    return rows.map(mapRow);
  },

  async getById(id: string): Promise<Debt | null> {
    const db = await getDatabase();
    const r = await db.getFirstAsync<any>(`SELECT * FROM debts WHERE id = ?;`, [id]);
    return r ? mapRow(r) : null;
  },

  async create(input: CreateDebtInput): Promise<Debt> {
    const db = await getDatabase();
    const id = "debt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const createdAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO debts (id, name, balance, interest_rate, min_payment, strategy, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [id, input.name, input.balance, input.interest_rate, input.min_payment, input.strategy || "snowball", createdAt]
    );
    return {
      id,
      name: input.name,
      balance: input.balance,
      interest_rate: input.interest_rate,
      min_payment: input.min_payment,
      strategy: input.strategy || "snowball",
      created_at: createdAt,
    };
  },

  async update(id: string, data: UpdateDebtInput): Promise<Debt | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;
    const merged: Debt = {
      id,
      name: data.name ?? existing.name,
      balance: data.balance ?? Number(existing.balance),
      interest_rate: data.interest_rate ?? Number(existing.interest_rate),
      min_payment: data.min_payment ?? Number(existing.min_payment),
      strategy: data.strategy ?? existing.strategy,
      created_at: existing.created_at,
    };
    await db.runAsync(
      `UPDATE debts SET name = ?, balance = ?, interest_rate = ?, min_payment = ?, strategy = ? WHERE id = ?;`,
      [merged.name, merged.balance, merged.interest_rate, merged.min_payment, merged.strategy, id]
    );
    return merged;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM debts WHERE id = ?;`, [id]);
    return result.changes > 0;
  },
};
