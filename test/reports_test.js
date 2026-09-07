const assert = require("assert");

console.log("=== RUNNING MONTHLY/QUARTERLY REPORT + CSV TESTS (Phase 6) ===");

function prevMonth(p) {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthly(period, txs, map, scope = "family") {
  const inScope = (t) => {
    if (scope === "family") return true;
    return map[t.account_id] === scope;
  };
  const sum = (l, ty) => l.filter((t) => t.type === ty).reduce((s, t) => s + t.amount, 0);
  const cur = txs.filter((t) => t.date.startsWith(period) && inScope(t));
  const prv = txs.filter((t) => t.date.startsWith(prevMonth(period)) && inScope(t));
  const ti = sum(cur, "income"), te = sum(cur, "expense");
  const pti = sum(prv, "income"), pte = sum(prv, "expense");
  const grp = (ty) => {
    const m = {};
    for (const t of cur.filter((x) => x.type === ty)) {
      m[t.category] = m[t.category] || { total: 0, count: 0 };
      m[t.category].total += t.amount; m[t.category].count++;
    }
    const den = ty === "expense" ? te : ti;
    return Object.entries(m).map(([category, v]) => ({ category, total: v.total, count: v.count, sharePct: den > 0 ? Math.round((v.total / den) * 100) : 0 })).sort((a, b) => b.total - a.total);
  };
  return {
    period, totalIncome: ti, totalExpense: te, net: ti - te,
    rate: ti > 0 ? Math.round(((ti - te) / ti) * 100) : 0,
    prevIncome: pti, prevExpense: pte, dI: ti - pti, dE: te - pte, dN: (ti - te) - (pti - pte),
    exp: grp("expense"), inc: grp("income"),
  };
}
function toCSVMonthly(r) {
  const esc = (v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [
    "h1",
    ["monthly", r.period, r.totalIncome, r.totalExpense, r.net, r.rate].map(esc).join(","),
    "",
    ...r.exp.map((c) => [c.category, c.total, c.count, c.sharePct].map(esc).join(",")),
  ].join("\n");
}

const MAP = { acc_p: "personal", acc_b: "business" };
const TXS = [
  { account_id: "acc_p", type: "income", category: "Lương cố định", amount: 25000000, date: "2026-08-01" },
  { account_id: "acc_p", type: "expense", category: "Ăn uống", amount: 6000000, date: "2026-08-05" },
  { account_id: "acc_p", type: "expense", category: "Nhà ở & Tiện ích", amount: 8000000, date: "2026-08-06" },
  { account_id: "acc_b", type: "income", category: "Doanh thu Shop Online", amount: 40000000, date: "2026-08-02" },
  { account_id: "acc_b", type: "expense", category: "Giá vốn / Nhập hàng", amount: 15000000, date: "2026-08-07" },
  { account_id: "acc_p", type: "income", category: "Lương cố định", amount: 26000000, date: "2026-09-01" },
  { account_id: "acc_p", type: "expense", category: "Ăn uống", amount: 7000000, date: "2026-09-05" },
  { account_id: "acc_p", type: "expense", category: "Giải trí & Du lịch", amount: 3000000, date: "2026-09-06" },
  { account_id: "acc_b", type: "income", category: "Doanh thu Shop Online", amount: 30000000, date: "2026-09-02" },
  { account_id: "acc_b", type: "expense", category: "Giá vốn / Nhập hàng", amount: 10000000, date: "2026-09-07" },
  { account_id: "acc_p", type: "expense", category: 'Ăn "đặc biệt", ngoài', amount: 500000, date: "2026-09-08" },
];

// --- TEST 1: monthly family totals + compare ---
{
  const r = monthly("2026-09", TXS, MAP, "family");
  assert.strictEqual(r.totalIncome, 56000000);
  assert.strictEqual(r.totalExpense, 20500000);
  assert.strictEqual(r.net, 35500000);
  assert.strictEqual(r.rate, 63);
  assert.strictEqual(r.prevIncome, 65000000);
  assert.strictEqual(r.dI, -9000000);
  console.log("--- TEST 1: monthly totals + prev-compare PASS ---");
}

// --- TEST 2: scope separation (personal excludes business) ---
{
  const p = monthly("2026-09", TXS, MAP, "personal");
  assert.strictEqual(p.totalIncome, 26000000);
  assert.strictEqual(p.totalExpense, 10500000);
  const b = monthly("2026-09", TXS, MAP, "business");
  assert.strictEqual(b.totalIncome, 30000000);
  assert.strictEqual(b.totalExpense, 10000000);
  console.log("--- TEST 2: scope separation PASS ---");
}

// --- TEST 3: category group-by sorted + share% ---
{
  const r = monthly("2026-09", TXS, MAP, "family");
  assert.strictEqual(r.exp[0].category, "Giá vốn / Nhập hàng");
  assert.strictEqual(r.exp[0].total, 10000000);
  const food = r.exp.find((c) => c.category === "Ăn uống");
  assert.strictEqual(food.sharePct, Math.round((7000000 / 20500000) * 100));
  console.log("--- TEST 3: category group-by PASS ---");
}

// --- TEST 4: quarterly aggregation + trend ---
{
  const m7 = monthly("2026-07", TXS, MAP, "family");
  assert.strictEqual(m7.totalIncome, 0);
  const q3 = ["2026-07", "2026-08", "2026-09"].map((p) => monthly(p, TXS, MAP, "family"));
  const ti = q3.reduce((s, r) => s + r.totalIncome, 0);
  assert.strictEqual(ti, 121000000);
  const trend = q3[2].rate > q3[0].rate ? "up" : "flat";
  assert.strictEqual(trend, "up"); // T7 0% -> T9 63%
  console.log("--- TEST 4: quarterly aggregation PASS ---");
}

// --- TEST 5: CSV escaping (comma + quotes) ---
{
  const r = monthly("2026-09", TXS, MAP, "family");
  const csv = toCSVMonthly(r);
  assert.ok(csv.includes('"Ăn ""đặc biệt"", ngoài"'), "CSV must escape quotes+comma, got:\n" + csv);
  assert.ok(csv.includes("monthly,2026-09,56000000,20500000,35500000,63"));
  // mở được: mỗi dòng data có đúng 6 cột ở header-line
  const dataLine = csv.split("\n")[1];
  assert.strictEqual(dataLine.split(",").length, 6);
  console.log("--- TEST 5: CSV escaping + openable PASS ---");
}

// --- TEST 6: empty month ---
{
  const r = monthly("2026-01", TXS, MAP, "family");
  assert.strictEqual(r.totalIncome, 0);
  assert.strictEqual(r.rate, 0);
  assert.strictEqual(r.exp.length, 0);
  console.log("--- TEST 6: empty month PASS ---");
}

console.log("=== ALL REPORT TESTS PASSED 100% ===");
