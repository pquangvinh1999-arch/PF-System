import { getDatabase } from "./index";
import { PlannedExpense } from "../types";

export class PlannedExpensesDao {
  static async getAll(): Promise<PlannedExpense[]> {
    const db = await getDatabase();
    return await db.getAllAsync<PlannedExpense>(
      `SELECT * FROM planned_expenses ORDER BY due_date ASC;`
    );
  }

  static async getByPeriod(period: string): Promise<PlannedExpense[]> {
    const db = await getDatabase();
    return await db.getAllAsync<PlannedExpense>(
      `SELECT * FROM planned_expenses WHERE due_date LIKE ? ORDER BY due_date ASC;`,
      [`${period}%`]
    );
  }

  static async getByDate(date: string): Promise<PlannedExpense[]> {
    const db = await getDatabase();
    return await db.getAllAsync<PlannedExpense>(
      `SELECT * FROM planned_expenses WHERE due_date = ? ORDER BY amount DESC;`,
      [date]
    );
  }

  static async create(data: Omit<PlannedExpense, "id"> & { id?: string }): Promise<PlannedExpense> {
    const db = await getDatabase();
    const id = data.id || `pe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.runAsync(
      `INSERT INTO planned_expenses (id, title, amount, due_date, category, account_id, recurrence, linked_goal_id, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.title,
        data.amount,
        data.due_date,
        data.category,
        data.account_id,
        data.recurrence,
        data.linked_goal_id || null,
        data.status,
        data.note || null,
      ]
    );
    return {
      id,
      title: data.title,
      amount: data.amount,
      due_date: data.due_date,
      category: data.category,
      account_id: data.account_id,
      recurrence: data.recurrence,
      linked_goal_id: data.linked_goal_id,
      status: data.status,
      note: data.note,
    };
  }

  static async update(
    id: string,
    data: Partial<Omit<PlannedExpense, "id">>
  ): Promise<PlannedExpense | null> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<PlannedExpense>(
      `SELECT * FROM planned_expenses WHERE id = ?;`,
      [id]
    );
    if (!existing) return null;

    const updated: PlannedExpense = {
      id,
      title: data.title !== undefined ? data.title : existing.title,
      amount: data.amount !== undefined ? data.amount : Number(existing.amount),
      due_date: data.due_date !== undefined ? data.due_date : existing.due_date,
      category: data.category !== undefined ? data.category : existing.category,
      account_id: data.account_id !== undefined ? data.account_id : existing.account_id,
      recurrence: data.recurrence !== undefined ? data.recurrence : existing.recurrence,
      linked_goal_id:
        data.linked_goal_id !== undefined ? data.linked_goal_id : existing.linked_goal_id,
      status: data.status !== undefined ? data.status : existing.status,
      note: data.note !== undefined ? data.note : existing.note,
    };

    await db.runAsync(
      `UPDATE planned_expenses
       SET title = ?, amount = ?, due_date = ?, category = ?, account_id = ?, recurrence = ?, linked_goal_id = ?, status = ?, note = ?
       WHERE id = ?;`,
      [
        updated.title,
        updated.amount,
        updated.due_date,
        updated.category,
        updated.account_id,
        updated.recurrence,
        updated.linked_goal_id || null,
        updated.status,
        updated.note || null,
        id,
      ]
    );

    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM planned_expenses WHERE id = ?;`, [id]);
    return result.changes > 0;
  }
}
