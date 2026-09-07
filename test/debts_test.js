const assert = require("assert");
const { DatabaseSync } = require("node:sqlite");

console.log("=== RUNNING DEBT CRUD + SNOWBALL/AVALANCHE + PAYOFF TESTS (Phase 5) ===");

// Mirror DebtService.validate
function parseNum(v) {
  if (typeof v === "number") return v;
  return parseFloat(String(v ?? "").replace(/[.\sđ₫,%]/g, "").replace(/,/g, ""));
}
function validate(input) {
  const name = String(input.name ?? "").trim();
  if (!name) return { isValid: false, error: "Vui lòng nhập tên khoản nợ" };
  const balance = parseNum(input.balance);
  if (isNaN(balance) || balance <= 0) return { isValid: false, error: "Vui lòng nhập dư nợ hợp lệ (> 0)" };
  const rate = parseNum(input.interestRate);
  if (isNaN(rate) || rate < 0 || rate > 100) return { isValid: false, error: "Lãi suất phải từ 0 đến 100 (%/năm)" };
  const minPay = parseNum(input.minPayment);
  if (isNaN(minPay) || minPay <= 0) return { isValid: false, error: "Vui lòng nhập khoản trả tối thiểu (> 0)" };
  return { isValid: true, data: { name, balance: Math.round(balance), interest_rate: rate, min_payment: Math.round(minPay) } };
}
function sortDebts(debts, strategy) {
  const arr = [...debts];
  if (strategy === "snowball") arr.sort((a, b) => a.balance - b.balance || b.interest_rate - a.interest_rate);
  else arr.sort((a, b) => b.interest_rate - a.interest_rate || a.balance - b.balance);
  return arr;
}
function estimateMonths(balance, annualRate, minPay, maxM = 600) {
  if (balance <= 0) return 0;
  if (minPay <= 0) return maxM;
  const r = annualRate / 100 / 12;
  if (r <= 0) return Math.ceil(balance / minPay);
  if (minPay <= balance * r) return maxM;
  let b = balance, m = 0;
  while (b > 0 && m < maxM) { b = b * (1 + r) - minPay; m++; }
  return m;
}

// --- TEST 1: validation ---
{
  assert.strictEqual(validate({ name: "", balance: 1000, interestRate: 10, minPayment: 100 }).isValid, false);
  assert.strictEqual(validate({ name: "X", balance: 0, interestRate: 10, minPayment: 100 }).error.includes("dư nợ"), true);
  assert.strictEqual(validate({ name: "X", balance: 1000, interestRate: 150, minPayment: 100 }).error.includes("Lãi suất"), true);
  assert.strictEqual(validate({ name: "Thẻ VCB", balance: "20,000,000", interestRate: "18", minPayment: "2000000" }).isValid, true);
  console.log("--- TEST 1: Debt validation PASS ---");
}

// --- TEST 2: Snowball vs Avalanche ordering ---
{
  const debts = [
    { id: "a", name: "Vay xe", balance: 50000000, interest_rate: 12 },
    { id: "b", name: "Thẻ tín dụng", balance: 8000000, interest_rate: 30 },
    { id: "c", name: "Vay bạn", balance: 15000000, interest_rate: 0 },
  ];
  const snow = sortDebts(debts, "snowball").map((d) => d.id);
  assert.deepStrictEqual(snow, ["b", "c", "a"]); // dư nợ tăng dần
  const aval = sortDebts(debts, "avalanche").map((d) => d.id);
  assert.deepStrictEqual(aval, ["b", "a", "c"]); // lãi giảm dần
  console.log("--- TEST 2: Snowball/Avalanche sort PASS ---");
}

// --- TEST 3: payoff estimate math ---
{
  assert.strictEqual(estimateMonths(12000000, 0, 2000000), 6);
  const m = estimateMonths(10000000, 12, 1000000);
  assert.ok(m >= 10 && m <= 12, "expected ~11 months, got " + m);
  assert.strictEqual(estimateMonths(10000000, 24, 100000), 600); // không đủ trả lãi
  console.log("--- TEST 3: payoff estimate PASS ---");
}

// --- TEST 4-6: SQLite CRUD mirroring schema.ts debts ---
const db = new DatabaseSync(":memory:");
db.exec(`
  CREATE TABLE debts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    balance REAL NOT NULL,
    interest_rate REAL NOT NULL,
    min_payment REAL NOT NULL,
    strategy TEXT NOT NULL CHECK(strategy IN ('snowball', 'avalanche')),
    created_at TEXT NOT NULL
  );
`);
{
  const ins = db.prepare("INSERT INTO debts (id, name, balance, interest_rate, min_payment, strategy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  ins.run("d1", "Thẻ tín dụng VCB", 8000000, 30, 1000000, "snowball", new Date().toISOString());
  ins.run("d2", "Vay mua xe", 50000000, 12, 3000000, "avalanche", new Date().toISOString());
  assert.strictEqual(db.prepare("SELECT COUNT(*) as c FROM debts").get().c, 2);
  console.log("--- TEST 4: Create debts PASS ---");
}
{
  db.prepare("UPDATE debts SET balance = ? WHERE id = ?").run(7000000, "d1");
  assert.strictEqual(db.prepare("SELECT balance FROM debts WHERE id = ?").get("d1").balance, 7000000);
  assert.throws(() => {
    db.prepare("INSERT INTO debts (id, name, balance, interest_rate, min_payment, strategy, created_at) VALUES ('dx','Sai',100,5,50,'random','x')").run();
  });
  console.log("--- TEST 5: Update + CHECK constraint PASS ---");
}
{
  assert.strictEqual(db.prepare("DELETE FROM debts WHERE id = ?").run("d2").changes, 1);
  assert.strictEqual(db.prepare("SELECT COUNT(*) as c FROM debts").get().c, 1);
  console.log("--- TEST 6: Delete debt PASS ---");
}

console.log("=== ALL DEBT TESTS PASSED 100% ===");
