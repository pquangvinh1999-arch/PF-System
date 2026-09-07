/**
 * Định nghĩa SQLite Schema Migration theo đúng PLAN.md & DESIGN.md
 */

export const INITIAL_MIGRATION_SQL = [
  // Bảng quản lý version migration
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );`,

  // 1. Users
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT DEFAULT "VND",
    created_at TEXT NOT NULL
  );`,

  // 2. Income Sources
  `CREATE TABLE IF NOT EXISTS income_sources (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ("fixed_salary", "business_revenue", "other")),
    amount REAL NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ("monthly", "weekly", "irregular")),
    date TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  // 3. Accounts (Tách Personal / Business)
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ("personal", "business")),
    balance REAL NOT NULL DEFAULT 0,
    initial_balance REAL NOT NULL DEFAULT 0,
    color TEXT,
    icon TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,

  // 4. Transactions
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ("income", "expense", "transfer")),
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    income_source_id TEXT,
    to_account_id TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );`,

  // 5. Budgets (50/30/20)
  `CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    period TEXT NOT NULL,
    category TEXT NOT NULL,
    allocated_percentage REAL NOT NULL,
    allocated_amount REAL NOT NULL,
    budget_group TEXT CHECK(budget_group IN ("needs", "wants", "savings")),
    created_at TEXT NOT NULL
  );`,

  // 6. Profit First Rules (Chỉ áp dụng cho Business Account)
  `CREATE TABLE IF NOT EXISTS profit_first_rules (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('profit', 'tax', 'owner_pay', 'opex', 'reserve')),
    percentage REAL NOT NULL,
    name TEXT,
    order_index INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );`,

  // 7. Goals (Emergency Fund, v.v.)
  `CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ("emergency_fund", "short_term", "mid_term", "long_term")),
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    deadline TEXT,
    monthly_target_contribution REAL,
    created_at TEXT NOT NULL
  );`,

  // 8. Debts (Snowball / Avalanche)
  `CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    balance REAL NOT NULL,
    interest_rate REAL NOT NULL,
    min_payment REAL NOT NULL,
    strategy TEXT NOT NULL CHECK(strategy IN ("snowball", "avalanche")),
    created_at TEXT NOT NULL
  );`,

  // 9. Planned Expenses (DESIGN.md mục 4)
  `CREATE TABLE IF NOT EXISTS planned_expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    category TEXT NOT NULL,
    account_id TEXT NOT NULL,
    recurrence TEXT NOT NULL CHECK(recurrence IN ('none', 'monthly', 'yearly')),
    linked_goal_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('upcoming', 'paid', 'overdue')),
    note TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_goal_id) REFERENCES goals(id) ON DELETE SET NULL
  );`,

  // 10. Reports
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    period TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ("monthly", "quarterly")),
    total_income REAL NOT NULL,
    total_expense REAL NOT NULL,
    net_savings REAL NOT NULL,
    savings_rate REAL NOT NULL,
    category_breakdown TEXT NOT NULL,
    generated_at TEXT NOT NULL
  );`
];
