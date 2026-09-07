import { getDatabase } from "./index";
import { Transaction, TransactionType } from "../types";
import { AccountsDao } from "./accountsDao";

export const TransactionsDao = {
  async getAll(): Promise<Transaction[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions ORDER BY date DESC, created_at DESC;"
    );
  },

  async getByAccountId(accountId: string): Promise<Transaction[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions WHERE account_id = ? OR to_account_id = ? ORDER BY date DESC, created_at DESC;",
      [accountId, accountId]
    );
  },

  async getByPeriod(yearMonth: string): Promise<Transaction[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC, created_at DESC;",
      [`${yearMonth}%`]
    );
  },

  async getById(id: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ?;",
      [id]
    );
    return result || null;
  },

  async create(data: {
    account_id: string;
    type: TransactionType;
    category: string;
    amount: number;
    date: string;
    income_source_id?: string;
    to_account_id?: string;
    note?: string;
  }): Promise<Transaction> {
    const db = await getDatabase();
    const id = "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, category, amount, date, income_source_id, to_account_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.account_id,
        data.type,
        data.category,
        data.amount,
        data.date,
        data.income_source_id || null,
        data.to_account_id || null,
        data.note || "",
        createdAt,
      ]
    );

    // Cập nhật lại số dư tài khoản tự động
    await AccountsDao.recalculateBalance(data.account_id);
    if (data.to_account_id) {
      await AccountsDao.recalculateBalance(data.to_account_id);
    }

    return {
      id,
      account_id: data.account_id,
      type: data.type,
      category: data.category,
      amount: data.amount,
      date: data.date,
      income_source_id: data.income_source_id,
      to_account_id: data.to_account_id,
      note: data.note,
      created_at: createdAt,
    };
  },

  async update(
    id: string,
    data: Partial<{
      account_id: string;
      type: TransactionType;
      category: string;
      amount: number;
      date: string;
      income_source_id?: string;
      to_account_id?: string;
      note?: string;
    }>
  ): Promise<Transaction | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const oldAccountId = existing.account_id;
    const oldToAccountId = existing.to_account_id;

    const updated: Transaction = {
      ...existing,
      ...data,
    };

    const db = await getDatabase();
    await db.runAsync(
      `UPDATE transactions SET
         account_id = ?,
         type = ?,
         category = ?,
         amount = ?,
         date = ?,
         income_source_id = ?,
         to_account_id = ?,
         note = ?
       WHERE id = ?;`,
      [
        updated.account_id,
        updated.type,
        updated.category,
        updated.amount,
        updated.date,
        updated.income_source_id || null,
        updated.to_account_id || null,
        updated.note || "",
        id,
      ]
    );

    // Đồng bộ lại số dư các tài khoản liên quan
    const accountsToRecalc = new Set<string>([
      oldAccountId,
      updated.account_id,
      ...(oldToAccountId ? [oldToAccountId] : []),
      ...(updated.to_account_id ? [updated.to_account_id] : []),
    ]);

    for (const accId of accountsToRecalc) {
      await AccountsDao.recalculateBalance(accId);
    }

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    const db = await getDatabase();
    await db.runAsync("DELETE FROM transactions WHERE id = ?;", [id]);

    // Đồng bộ lại số dư tài khoản sau khi xóa giao dịch
    await AccountsDao.recalculateBalance(existing.account_id);
    if (existing.to_account_id) {
      await AccountsDao.recalculateBalance(existing.to_account_id);
    }

    return true;
  },
};
