const { DatabaseSync } = require('node:sqlite');
const assert = require('node:assert');

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');

// 1. DDL
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS income_sources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fixed_salary', 'business_revenue', 'other')),
  amount REAL NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  date TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('personal', 'business')),
  balance REAL NOT NULL DEFAULT 0,
  initial_balance REAL NOT NULL DEFAULT 0,
  color TEXT,
  icon TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  income_source_id TEXT,
  to_account_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
`);

console.log('--- TEST 1: Schema creation successful ---');

// Helper recalculate function matching AccountsDao
function recalculateBalance(accountId) {
  const acc = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  if (!acc) return 0;

  const incRes = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type = 'income'").get(accountId);
  const expRes = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type = 'expense'").get(accountId);
  const transferOutRes = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type = 'transfer'").get(accountId);
  const transferInRes = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE to_account_id = ? AND type = 'transfer'").get(accountId);

  const newBalance = acc.initial_balance + incRes.total - expRes.total - transferOutRes.total + transferInRes.total;
  db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, accountId);
  return newBalance;
}

// 2. Insert User and Accounts
db.prepare("INSERT INTO users VALUES ('usr_1', 'Vinh', 'VND', '2026-09-07T00:00:00Z')").run();
db.prepare("INSERT INTO accounts VALUES ('acc_pers', 'Ví Cá nhân', 'personal', 10000000, 10000000, '#0F6E5B', 'wallet', 1, '2026-09-07T00:00:00Z')").run();
db.prepare("INSERT INTO accounts VALUES ('acc_biz', 'Ví Kinh doanh', 'business', 20000000, 20000000, '#4A5FD1', 'briefcase', 0, '2026-09-07T00:00:00Z')").run();

// 3. Expense Transaction 500,000 VND
db.prepare("INSERT INTO transactions VALUES ('tx_1', 'acc_pers', 'expense', 'Ăn uống', 500000, '2026-09-07', NULL, NULL, 'Cơm trưa', '2026-09-07T12:00:00Z')").run();
recalculateBalance('acc_pers');

let persAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get('acc_pers');
assert.strictEqual(persAcc.balance, 9500000, 'Ví cá nhân sau chi 500k phải là 9.500.000');
console.log('--- TEST 2: Expense balance calculation PASS (9,500,000) ---');

// 4. Income Transaction 2,000,000 VND
db.prepare("INSERT INTO transactions VALUES ('tx_2', 'acc_pers', 'income', 'Lương', 2000000, '2026-09-07', NULL, NULL, 'Thưởng dự án', '2026-09-07T13:00:00Z')").run();
recalculateBalance('acc_pers');

persAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get('acc_pers');
assert.strictEqual(persAcc.balance, 11500000, 'Ví cá nhân sau thu 2tr phải là 11.500.000');
console.log('--- TEST 3: Income balance calculation PASS (11,500,000) ---');

// 5. Transfer Transaction 3,000,000 VND from Biz to Pers
db.prepare("INSERT INTO transactions VALUES ('tx_3', 'acc_biz', 'transfer', 'Rút lợi nhuận', 3000000, '2026-09-07', NULL, 'acc_pers', 'Rút tiền lời shop', '2026-09-07T14:00:00Z')").run();
recalculateBalance('acc_biz');
recalculateBalance('acc_pers');

let bizAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get('acc_biz');
persAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get('acc_pers');
assert.strictEqual(bizAcc.balance, 17000000, 'Ví kinh doanh sau chuyển 3tr phải là 17.000.000');
assert.strictEqual(persAcc.balance, 14500000, 'Ví cá nhân sau nhận 3tr phải là 14.500.000');
console.log('--- TEST 4: Transfer balance calculation PASS (Biz: 17M, Pers: 14.5M) ---');

// 6. Update tx_1 amount from 500,000 to 1,000,000
db.prepare("UPDATE transactions SET amount = 1000000 WHERE id = 'tx_1'").run();
recalculateBalance('acc_pers');
persAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get('acc_pers');
assert.strictEqual(persAcc.balance, 14000000, 'Ví cá nhân sau update chi từ 500k lên 1tr phải là 14.000.000');
console.log('--- TEST 5: Update transaction balance recalculation PASS (14,000,000) ---');

// 7. Delete tx_1 (1,000,000)
db.prepare("DELETE FROM transactions WHERE id = 'tx_1'").run();
recalculateBalance('acc_pers');
persAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get('acc_pers');
assert.strictEqual(persAcc.balance, 15000000, 'Ví cá nhân sau xóa chi 1tr phải phục hồi về 15.000.000');
console.log('--- TEST 6: Delete transaction balance restoration PASS (15,000,000) ---');

console.log('=== ALL TRANSACTION UNIT TESTS PASSED 100% ===');
