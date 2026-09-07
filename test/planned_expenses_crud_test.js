const assert = require("assert");
const { DatabaseSync } = require("node:sqlite");

console.log("=== RUNNING PLANNED EXPENSES CRUD & BOTTOM SHEET LOGIC TESTS ===");

// 1. Validation helper function (matches PlannedExpenseSheet validation logic)
function validatePlannedExpenseInput({ title, amount, dueDate, recurrence, status, accountId }) {
  const cleanTitle = (title || "").trim();
  if (!cleanTitle) {
    return { isValid: false, error: "Vui lòng nhập tên khoản chi dự kiến" };
  }

  const numAmount = typeof amount === "number" ? amount : parseFloat(String(amount).replace(/,/g, ""));
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: "Vui lòng nhập số tiền hợp lệ (> 0)" };
  }

  const cleanDate = (dueDate || "").trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(cleanDate)) {
    return { isValid: false, error: "Ngày đến hạn không đúng định dạng YYYY-MM-DD (ví dụ: 2026-09-25)" };
  }

  const validRecurrences = ["none", "monthly", "yearly"];
  if (recurrence && !validRecurrences.includes(recurrence)) {
    return { isValid: false, error: "Tần suất lặp lại không hợp lệ" };
  }

  const validStatuses = ["upcoming", "paid", "overdue"];
  if (status && !validStatuses.includes(status)) {
    return { isValid: false, error: "Trạng thái khoản chi không hợp lệ" };
  }

  return {
    isValid: true,
    data: {
      title: cleanTitle,
      amount: numAmount,
      due_date: cleanDate,
      category: "Đám tiệc / Sự kiện",
      account_id: accountId || "personal",
      recurrence: recurrence || "none",
      status: status || "upcoming",
    },
  };
}

// 2. Setup In-Memory SQLite DB matching schema.ts
const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('personal', 'business')),
    balance REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL
  );

  CREATE TABLE planned_expenses (
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
  );
`);

// Insert mock accounts & goal
db.prepare("INSERT INTO accounts (id, name, type, balance) VALUES (?, ?, ?, ?)").run("acc_personal", "Ví Cá nhân", "personal", 15000000);
db.prepare("INSERT INTO accounts (id, name, type, balance) VALUES (?, ?, ?, ?)").run("acc_business", "Shop Kinh doanh", "business", 25000000);
db.prepare("INSERT INTO goals (id, name, target_amount) VALUES (?, ?, ?)").run("goal_wedding", "Quỹ đám cưới", 5000000);

// --- TEST 1: Validation Logic ---
{
  const invalid1 = validatePlannedExpenseInput({ title: "", amount: 1000000, dueDate: "2026-09-25" });
  assert.strictEqual(invalid1.isValid, false);
  assert.strictEqual(invalid1.error, "Vui lòng nhập tên khoản chi dự kiến");

  const invalid2 = validatePlannedExpenseInput({ title: "Đám cưới bạn", amount: 0, dueDate: "2026-09-25" });
  assert.strictEqual(invalid2.isValid, false);
  assert.strictEqual(invalid2.error, "Vui lòng nhập số tiền hợp lệ (> 0)");

  const invalid3 = validatePlannedExpenseInput({ title: "Đám cưới bạn", amount: 1000000, dueDate: "25/09/2026" });
  assert.strictEqual(invalid3.isValid, false);
  assert.strictEqual(invalid3.error, "Ngày đến hạn không đúng định dạng YYYY-MM-DD (ví dụ: 2026-09-25)");

  const valid = validatePlannedExpenseInput({
    title: "  Đám cưới bạn thân A  ",
    amount: "1,500,000",
    dueDate: "2026-09-25",
    recurrence: "none",
    status: "upcoming",
  });
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.data.title, "Đám cưới bạn thân A");
  assert.strictEqual(valid.data.amount, 1500000);
  assert.strictEqual(valid.data.due_date, "2026-09-25");
  console.log("--- TEST 1: Input validation rules PASS ---");
}

// --- TEST 2: Planned Expense Creation (C in CRUD) ---
{
  const stmt = db.prepare(`
    INSERT INTO planned_expenses (id, title, amount, due_date, category, account_id, recurrence, linked_goal_id, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    "pe_001",
    "Đám cưới bạn thân A",
    1500000,
    "2026-09-25",
    "Đám tiệc / Sự kiện",
    "acc_personal",
    "none",
    "goal_wedding",
    "upcoming",
    "Mừng cưới bạn cấp 3"
  );

  stmt.run(
    "pe_002",
    "Học phí con quý 4",
    6000000,
    "2026-09-28",
    "Học phí & Giáo dục",
    "acc_personal",
    "none",
    null,
    "upcoming",
    "Chuyển khoản trường Vinschool"
  );

  stmt.run(
    "pe_003",
    "Nhập hàng máy móc Shop",
    12000000,
    "2026-09-20",
    "Chi phí kinh doanh",
    "acc_business",
    "monthly",
    null,
    "upcoming",
    "Lấy hàng từ xưởng"
  );

  const countRow = db.prepare("SELECT COUNT(*) as c FROM planned_expenses").get();
  assert.strictEqual(countRow.c, 3);
  console.log("--- TEST 2: Create planned expenses PASS (3 items created) ---");
}

// --- TEST 3: Query by period & by date (R in CRUD) ---
{
  const periodRows = db.prepare("SELECT * FROM planned_expenses WHERE due_date LIKE ? ORDER BY due_date ASC").all("2026-09%");
  assert.strictEqual(periodRows.length, 3);
  assert.strictEqual(periodRows[0].id, "pe_003"); // 2026-09-20
  assert.strictEqual(periodRows[1].id, "pe_001"); // 2026-09-25
  assert.strictEqual(periodRows[2].id, "pe_002"); // 2026-09-28

  const dayRows = db.prepare("SELECT * FROM planned_expenses WHERE due_date = ?").all("2026-09-25");
  assert.strictEqual(dayRows.length, 1);
  assert.strictEqual(dayRows[0].title, "Đám cưới bạn thân A");
  assert.strictEqual(dayRows[0].amount, 1500000);
  assert.strictEqual(dayRows[0].linked_goal_id, "goal_wedding");
  console.log("--- TEST 3: Query by period & date PASS ---");
}

// --- TEST 4: Update planned expense & toggle status (U in CRUD) ---
{
  // Cập nhật số tiền và đánh dấu đã chi (paid)
  db.prepare(`
    UPDATE planned_expenses
    SET amount = ?, status = ?, note = ?
    WHERE id = ?
  `).run(1800000, "paid", "Đã mừng cưới 1.8M", "pe_001");

  const updated = db.prepare("SELECT * FROM planned_expenses WHERE id = ?").get("pe_001");
  assert.strictEqual(updated.amount, 1800000);
  assert.strictEqual(updated.status, "paid");
  assert.strictEqual(updated.note, "Đã mừng cưới 1.8M");

  // Kiểm tra toggle ngược lại sang "upcoming"
  db.prepare("UPDATE planned_expenses SET status = ? WHERE id = ?").run("upcoming", "pe_001");
  const toggled = db.prepare("SELECT status FROM planned_expenses WHERE id = ?").get("pe_001");
  assert.strictEqual(toggled.status, "upcoming");

  // Chuyển lại paid để phục vụ các test sau
  db.prepare("UPDATE planned_expenses SET status = ? WHERE id = ?").run("paid", "pe_001");
  console.log("--- TEST 4: Update and status toggle PASS ---");
}

// --- TEST 5: Account separation & Recurrence rules ---
{
  const personalItems = db.prepare("SELECT * FROM planned_expenses WHERE account_id = 'acc_personal'").all();
  const businessItems = db.prepare("SELECT * FROM planned_expenses WHERE account_id = 'acc_business'").all();

  assert.strictEqual(personalItems.length, 2);
  assert.strictEqual(businessItems.length, 1);
  assert.strictEqual(businessItems[0].recurrence, "monthly");

  // Check recurrence check constraint rejection
  assert.throws(() => {
    db.prepare(`
      INSERT INTO planned_expenses (id, title, amount, due_date, category, account_id, recurrence, status)
      VALUES ('pe_invalid', 'Sai tần suất', 100, '2026-09-01', 'Khác', 'acc_personal', 'weekly', 'upcoming')
    `).run();
  });
  console.log("--- TEST 5: Account separation and recurrence constraints PASS ---");
}

// --- TEST 6: Delete planned expense (D in CRUD) ---
{
  const deleteResult = db.prepare("DELETE FROM planned_expenses WHERE id = ?").run("pe_003");
  assert.strictEqual(deleteResult.changes, 1);

  const remaining = db.prepare("SELECT COUNT(*) as c FROM planned_expenses").get();
  assert.strictEqual(remaining.c, 2);

  const deleted = db.prepare("SELECT * FROM planned_expenses WHERE id = ?").get("pe_003");
  assert.strictEqual(deleted, undefined);
  console.log("--- TEST 6: Delete planned expense PASS ---");
}

console.log("=== ALL PLANNED EXPENSES CRUD UNIT TESTS PASSED 100% ===");
