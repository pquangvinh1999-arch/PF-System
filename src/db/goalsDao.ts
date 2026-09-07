import { getDatabase } from "./index";
import { Goal, GoalType } from "../types";

export type CreateGoalInput = {
  name: string;
  type: GoalType;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
};

export type UpdateGoalInput = Partial<Omit<Goal, "id" | "created_at" | "deadline">> & {
  deadline?: string | null;
};

function mapRow(r: any): Goal {
  return {
    id: String(r.id),
    type: r.type as GoalType,
    name: String(r.name),
    target_amount: Number(r.target_amount),
    current_amount: Number(r.current_amount),
    deadline: r.deadline ?? undefined,
    monthly_target_contribution:
      r.monthly_target_contribution != null
        ? Number(r.monthly_target_contribution)
        : undefined,
    created_at: String(r.created_at),
  };
}

export const GoalsDao = {
  async getAll(): Promise<Goal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM goals ORDER BY created_at DESC;`
    );
    return rows.map(mapRow);
  },

  async getById(id: string): Promise<Goal | null> {
    const db = await getDatabase();
    const r = await db.getFirstAsync<any>(`SELECT * FROM goals WHERE id = ?;`, [
      id,
    ]);
    return r ? mapRow(r) : null;
  },

  async getByType(type: GoalType): Promise<Goal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM goals WHERE type = ? ORDER BY created_at DESC;`,
      [type]
    );
    return rows.map(mapRow);
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    const db = await getDatabase();
    const id =
      "goal_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const createdAt = new Date().toISOString();
    const current = input.current_amount ?? 0;
    await db.runAsync(
      `INSERT INTO goals (id, type, name, target_amount, current_amount, deadline, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.type,
        input.name,
        input.target_amount,
        current,
        input.deadline || null,
        createdAt,
      ]
    );
    return {
      id,
      type: input.type,
      name: input.name,
      target_amount: input.target_amount,
      current_amount: current,
      deadline: input.deadline || undefined,
      created_at: createdAt,
    };
  },

  async update(id: string, data: UpdateGoalInput): Promise<Goal | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;
    const merged: Goal = {
      id,
      type: data.type ?? existing.type,
      name: data.name ?? existing.name,
      target_amount:
        data.target_amount ?? Number(existing.target_amount),
      current_amount:
        data.current_amount ?? Number(existing.current_amount),
      deadline: data.deadline !== undefined ? data.deadline ?? undefined : existing.deadline,
      monthly_target_contribution:
        data.monthly_target_contribution !== undefined
          ? data.monthly_target_contribution
          : existing.monthly_target_contribution,
      created_at: existing.created_at,
    };
    await db.runAsync(
      `UPDATE goals SET type = ?, name = ?, target_amount = ?, current_amount = ?, deadline = ?, monthly_target_contribution = ? WHERE id = ?;`,
      [
        merged.type,
        merged.name,
        merged.target_amount,
        merged.current_amount,
        merged.deadline || null,
        merged.monthly_target_contribution ?? null,
        id,
      ]
    );
    return merged;
  },

  async contribute(id: string, amount: number): Promise<Goal | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const next = Math.max(
      0,
      Number(existing.current_amount) + Number(amount)
    );
    return this.update(id, { current_amount: next });
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM goals WHERE id = ?;`, [id]);
    return result.changes > 0;
  },
};
