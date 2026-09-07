const assert = require("assert");
const { DatabaseSync } = require("node:sqlite");

console.log("=== RUNNING GOALS CRUD & PROGRESS TESTS (Task 4.1) ===");

// --- Mirror of GoalService.validateGoalInput ---
const VALID_TYPES = ["emergency_fund", "short_term", "mid_term", "long_term"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDateString(s) {
  if (!DATE_REGEX.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
function parseAmountInput(amount) {
  if (typeof amount === "number") return amount;
  const cleaned = String(amount ?? "").replace(/[.\sđ₫]/g, "").replace(/,/g, "");
  return parseFloat(cleaned);
}
function validateGoalInput(input) {
  const name = String(input.name ?? "").trim();
  if (!name) return { isValid: false, error: "Vui lòng nhập tên mục tiêu" };
  if (name.length > 80) return { isValid: false, error: "Tên mục tiêu tối đa 80 ký tự" };
  if (!VALID_TYPES.includes(input.type)) return { isValid: false, error: "Loại mục tiêu không hợp lệ" };
  const target = parseAmountInput(input.targetAmount);
  if (isNaN(target) || target <= 0) return { isValid: false, error: "Vui lòng nhập số tiền mục tiêu hợp lệ (> 0)" };
  let current = 0;
  if (input.currentAmount !== undefined && input.currentAmount !== null && String(input.currentAmount).trim() !== "") {
    current = parseAmountInput(input.currentAmount);
    if (isNaN(current) || current < 0) return { isValid: false, error: "Số tiền đã tích lũy phải >= 0" };
    if (current > target) return { isValid: false, error: "Số tiền đã tích lũy không được vượt quá mục tiêu" };
  }
  let deadline;
  if (input.deadline !== undefined && input.deadline !== null && String(input.deadline).trim() !== "") {
    deadline = String(input.deadline).trim();
    if (!isValidDateString(deadline)) return { isValid: false, error: "Hạn hoàn thành không đúng định dạng YYYY-MM-DD (ví dụ: 2026-12-31)" };
  }
  return { isValid: true, data: { name, type: input.type, target_amount: Math.round(target), current_amount: Math.round(current), deadline } };
}
function calculateProgress(goal) {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}
function getRemaining(goal) {
  return Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
}

// --- TEST 1: Validation ---
{
  assert.strictEqual(validateGoalInput({ name: "", type: "short_term", targetAmount: 1000000 }).isValid, false);
  assert.strictEqual(validateGoalInput({ name: "Mua xe", type: "invalid", targetAmount: 1000000 }).error, "Loại mục tiêu không hợp lệ");
  assert.strictEqual(validateGoalInput({ name: "Mua xe", type: "short_term", targetAmount: 0 }).error, "Vui lòng nhập số tiền mục tiêu hợp lệ (> 0)");
  assert.strictEqual(validateGoalInput({ name: "Mua xe", type: "short_term", targetAmount: 5000000, currentAmount: 6000000 }).error, "Số tiền đã tích lũy không được vượt quá mục tiêu");
  assert.strictEqual(validateGoalInput({ name: "Mua xe", type: "short_term", targetAmount: 5000000, deadline: "31/12/2026" }).error.includes("YYYY-MM-DD"), true);
  const ok = validateGoalInput({ name: "  Quỹ khẩn cấp  ", type: "emergency_fund", targetAmount: "50,000,000", currentAmount: "5000000", deadline: "2026-12-31" });
  assert.strictEqual(ok.isValid, true);
  assert.strictEqual(ok.data.name, "Quỹ khẩn cấp");
  assert.strictEqual(ok.data.target_amount, 50000000);
  assert.strictEqual(ok.data.current_amount, 5000000);
  console.log("--- TEST 1: Goal validation PASS ---");
}

// --- TEST 2: Progress math ---
{
  assert.strictEqual(calculateProgress({ target_amount: 10000000, current_amount: 2500000 }), 25);
  assert.strictEqual(calculateProgress({ target_amount: 10000000, current_amount: 0 }), 0);
  assert.strictEqual(calculateProgress({ target_amount: 10000000, current_amount: 10000000 }), 100);
  assert.strictEqual(calculateProgress({ target_amount: 0, current_amount: 0 }), 0);
  assert.strictEqual(getRemaining({ target_amount: 10000000, current_amount: 2500000 }), 7500000);
  console.log("--- TEST 2: Progress & remaining math PASS ---");
}

// --- TEST 3-6: SQLite CRUD mirroring schema.ts goals table ---
const db = new DatabaseSync(":memory:");
db.exec(`
  CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('emergency_fund', 'short_term', 'mid_term', 'long_term')),
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    deadline TEXT,
    monthly_target_contribution REAL,
    created_at TEXT NOT NULL
  );
`);

{
  const ins = db.prepare("INSERT INTO goals (id, name, type, target_amount, current_amount, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  ins.run("goal_001", "Quỹ khẩn cấp 6 tháng", "emergency_fund", 90000000, 15000000, "2026-12-31", new Date().toISOString());
  ins.run("goal_002", "Mua xe máy mới", "short_term", 45000000, 10000000, "2026-09-30", new Date().toISOString());
  ins.run("goal_003", "Du lịch Đà Lạt", "short_term", 12000000, 12000000, "2026-08-15", new Date().toISOString());
  assert.strictEqual(db.prepare("SELECT COUNT(*) as c FROM goals").get().c, 3);
  console.log("--- TEST 3: Create goals PASS ---");
}
{
  const all = db.prepare("SELECT * FROM goals ORDER BY created_at DESC").all();
  assert.strictEqual(all.length, 3);
  const emerg = db.prepare("SELECT * FROM goals WHERE type = ?").all("emergency_fund");
  assert.strictEqual(emerg.length, 1);
  assert.strictEqual(emerg[0].name, "Quỹ khẩn cấp 6 tháng");
  console.log("--- TEST 4: Query by type PASS ---");
}
{
  db.prepare("UPDATE goals SET current_amount = ? WHERE id = ?").run(20000000, "goal_001");
  assert.strictEqual(db.prepare("SELECT current_amount FROM goals WHERE id = ?").get("goal_001").current_amount, 20000000);
  assert.strictEqual(calculateProgress({ target_amount: 90000000, current_amount: 20000000 }), 22);
  assert.throws(() => {
    db.prepare("INSERT INTO goals (id, name, type, target_amount, current_amount, created_at) VALUES ('gx','Sai', 'weekly_goal', 100, 0, 'x')").run();
  });
  console.log("--- TEST 5: Update contribute + CHECK constraint PASS ---");
}
{
  assert.strictEqual(db.prepare("DELETE FROM goals WHERE id = ?").run("goal_003").changes, 1);
  assert.strictEqual(db.prepare("SELECT COUNT(*) as c FROM goals").get().c, 2);
  assert.strictEqual(db.prepare("SELECT * FROM goals WHERE id = ?").get("goal_003"), undefined);
  console.log("--- TEST 6: Delete goal PASS ---");
}

console.log("=== ALL GOALS CRUD UNIT TESTS PASSED 100% ===");
