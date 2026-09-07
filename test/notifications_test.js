const assert = require("assert");

console.log("=== RUNNING LOCAL NOTIFICATIONS & REMINDERS UNIT TESTS ===");

function formatCurrency(amount) {
  return Math.round(amount).toLocaleString("vi-VN") + " đ";
}

// 1. Logic tính toán thời điểm trigger nhắc hạn (SKILLS.md Nhóm E)
function calculateTriggerDate(dueDateStr, daysBefore = 7) {
  const [year, month, day] = dueDateStr.split("-").map((v) => parseInt(v, 10));
  const targetDate = new Date(year, month - 1, day, 9, 0, 0, 0);
  targetDate.setDate(targetDate.getDate() - daysBefore);
  return targetDate;
}

// 2. Logic tạo nội dung thông báo
function generateReminderContent(expense, daysBefore) {
  const formattedAmount = formatCurrency(expense.amount);
  const title = `🔔 Nhắc hạn: ${expense.title}`;
  const body = `Khoản chi ${formattedAmount} sẽ đến hạn vào ngày ${expense.due_date} (${daysBefore} ngày nữa). Hãy chuẩn bị sẵn dòng tiền!`;
  return { title, body };
}

// 3. Logic lọc các khoản chi sắp đến hạn trong vòng N ngày
function getUpcomingExpensesWithinDays(expenses, days = 7, mockTodayStr = "2026-09-18") {
  const [y, m, d] = mockTodayStr.split("-").map((v) => parseInt(v, 10));
  const today = new Date(y, m - 1, d, 0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + days);
  maxDate.setHours(23, 59, 59, 999);

  return expenses
    .filter((e) => {
      if (e.status === "paid") return false;
      const [ey, em, ed] = e.due_date.split("-").map((v) => parseInt(v, 10));
      const expDate = new Date(ey, em - 1, ed);
      return expDate >= today && expDate <= maxDate;
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

// --- TEST 1: Trigger date calculation (7 days default & custom) ---
{
  const trigger7 = calculateTriggerDate("2026-09-25", 7);
  assert.strictEqual(trigger7.getFullYear(), 2026);
  assert.strictEqual(trigger7.getMonth(), 8); // Tháng 9 (0-indexed = 8)
  assert.strictEqual(trigger7.getDate(), 18);
  assert.strictEqual(trigger7.getHours(), 9);

  const trigger3 = calculateTriggerDate("2026-09-25", 3);
  assert.strictEqual(trigger3.getDate(), 22);

  const trigger1 = calculateTriggerDate("2026-09-25", 1);
  assert.strictEqual(trigger1.getDate(), 24);

  const trigger14 = calculateTriggerDate("2026-09-25", 14);
  assert.strictEqual(trigger14.getDate(), 11);

  console.log("--- TEST 1: Trigger date calculations PASS (1, 3, 7, 14 days) ---");
}

// --- TEST 2: Boundary crossing: month, year, and leap year ---
{
  // Tháng trước: 2026-10-03 trừ 7 ngày -> 2026-09-26
  const monthCross = calculateTriggerDate("2026-10-03", 7);
  assert.strictEqual(monthCross.getFullYear(), 2026);
  assert.strictEqual(monthCross.getMonth(), 8); // Tháng 9
  assert.strictEqual(monthCross.getDate(), 26);

  // Năm trước: 2027-01-04 trừ 7 ngày -> 2026-12-28
  const yearCross = calculateTriggerDate("2027-01-04", 7);
  assert.strictEqual(yearCross.getFullYear(), 2026);
  assert.strictEqual(yearCross.getMonth(), 11); // Tháng 12
  assert.strictEqual(yearCross.getDate(), 28);

  // Năm nhuận 2028: 2028-03-02 trừ 3 ngày -> 2028-02-28 (vì tháng 2 năm 2028 có 29 ngày)
  const leapCross = calculateTriggerDate("2028-03-02", 3);
  assert.strictEqual(leapCross.getFullYear(), 2028);
  assert.strictEqual(leapCross.getMonth(), 1); // Tháng 2
  assert.strictEqual(leapCross.getDate(), 28);

  console.log("--- TEST 2: Boundary crossing (month, year, leap year) PASS ---");
}

// --- TEST 3: Notification content formatting ---
{
  const expense = {
    id: "pe_01",
    title: "Đám cưới bạn thân",
    amount: 1500000,
    due_date: "2026-09-25",
    category: "Đám tiệc / Sự kiện",
    account_id: "personal",
    recurrence: "none",
    status: "upcoming",
  };

  const content = generateReminderContent(expense, 7);
  assert.strictEqual(content.title, "🔔 Nhắc hạn: Đám cưới bạn thân");
  assert.ok(content.body.includes("1.500.000 đ"));
  assert.ok(content.body.includes("2026-09-25"));
  assert.ok(content.body.includes("7 ngày nữa"));

  console.log("--- TEST 3: Notification content formatting PASS ---");
}

// --- TEST 4: Filtering upcoming expenses within 7 days ---
{
  const mockExpenses = [
    { id: "1", title: "Cà phê gặp khách", amount: 100000, due_date: "2026-09-19", status: "upcoming" }, // +1 ngày -> Included
    { id: "2", title: "Đám cưới", amount: 1500000, due_date: "2026-09-25", status: "upcoming" },        // +7 ngày -> Included
    { id: "3", title: "Đã chi trước", amount: 200000, due_date: "2026-09-21", status: "paid" },          // +3 ngày nhưng đã paid -> EXCLUDED
    { id: "4", title: "Học phí con", amount: 6000000, due_date: "2026-09-30", status: "upcoming" },       // +12 ngày -> EXCLUDED
    { id: "5", title: "Hôm qua", amount: 50000, due_date: "2026-09-17", status: "upcoming" },            // Quá hạn hôm qua -> EXCLUDED
  ];

  const upcoming = getUpcomingExpensesWithinDays(mockExpenses, 7, "2026-09-18");
  assert.strictEqual(upcoming.length, 2);
  assert.strictEqual(upcoming[0].id, "1"); // Sắp xếp theo ngày tăng dần
  assert.strictEqual(upcoming[1].id, "2");

  console.log("--- TEST 4: Upcoming within 7 days filtering & status check PASS ---");
}

// --- TEST 5: Reminder eligibility checks ---
{
  function checkReminderEligibility(expense, mockNow = new Date("2026-09-18T10:00:00")) {
    if (expense.status === "paid") {
      return { eligible: false, reason: "Khoản chi đã thanh toán, không cần nhắc hạn" };
    }
    const [y, m, d] = expense.due_date.split("-").map((v) => parseInt(v, 10));
    const dueDateTime = new Date(y, m - 1, d, 23, 59, 59);
    if (mockNow > dueDateTime) {
      return { eligible: false, reason: "Khoản chi đã quá hạn" };
    }
    return { eligible: true };
  }

  const paidExpense = { title: "Tiền điện", amount: 500000, due_date: "2026-09-20", status: "paid" };
  const overdueExpense = { title: "Internet", amount: 300000, due_date: "2026-09-15", status: "upcoming" };
  const validExpense = { title: "Học phí", amount: 4000000, due_date: "2026-09-28", status: "upcoming" };

  assert.strictEqual(checkReminderEligibility(paidExpense).eligible, false);
  assert.strictEqual(checkReminderEligibility(paidExpense).reason, "Khoản chi đã thanh toán, không cần nhắc hạn");

  assert.strictEqual(checkReminderEligibility(overdueExpense).eligible, false);
  assert.strictEqual(checkReminderEligibility(overdueExpense).reason, "Khoản chi đã quá hạn");

  assert.strictEqual(checkReminderEligibility(validExpense).eligible, true);

  console.log("--- TEST 5: Reminder eligibility check PASS ---");
}

console.log("=== ALL NOTIFICATIONS & REMINDERS UNIT TESTS PASSED 100% ===");
