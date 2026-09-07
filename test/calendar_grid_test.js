const assert = require("assert");

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateString(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatShortCurrency(amount) {
  if (amount <= 0) return "";
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (amount >= 1000) {
    const thousands = amount / 1000;
    return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(0)}k`;
  }
  return `${amount}`;
}

console.log("=== RUNNING CALENDAR GRID & UTILS UNIT TESTS ===");

// TEST 1: Days in month & leap year
assert.strictEqual(getDaysInMonth(2026, 9), 30); // September 2026 has 30 days
assert.strictEqual(getDaysInMonth(2026, 2), 28); // Feb 2026 has 28 days
assert.strictEqual(getDaysInMonth(2028, 2), 29); // Feb 2028 (leap year) has 29 days
assert.strictEqual(getDaysInMonth(2026, 8), 31); // August 2026 has 31 days
console.log("--- TEST 1: Days in month calculation (leap year & standard) PASS ---");

// TEST 2: First day of week index (Mon = 0, Tue = 1, ..., Sun = 6)
// 2026-09-01 was a Tuesday -> index 1
const sep2026FirstDay = getFirstDayOfWeek(2026, 9);
assert.strictEqual(sep2026FirstDay, 1, "September 1, 2026 must be Tuesday (index 1)");

// 2026-02-01 was a Sunday -> index 6
const feb2026FirstDay = getFirstDayOfWeek(2026, 2);
assert.strictEqual(feb2026FirstDay, 6, "February 1, 2026 must be Sunday (index 6)");
console.log("--- TEST 2: First day of week offset calculation PASS ---");

// TEST 3: Zero-padded date formatting
assert.strictEqual(formatDateString(2026, 9, 7), "2026-09-07");
assert.strictEqual(formatDateString(2026, 11, 24), "2026-11-24");
console.log("--- TEST 3: Zero-padded YYYY-MM-DD date string PASS ---");

// TEST 4: Short currency format
assert.strictEqual(formatShortCurrency(500000), "500k");
assert.strictEqual(formatShortCurrency(1000000), "1M");
assert.strictEqual(formatShortCurrency(2500000), "2.5M");
assert.strictEqual(formatShortCurrency(10000000), "10M");
console.log("--- TEST 4: Short currency formatting PASS ---");

// TEST 5: Grid total cells verification
function generateCalendarCells(year, month) {
  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= days; d++) {
    cells.push(d);
  }
  return cells;
}

const sepCells = generateCalendarCells(2026, 9);
assert.strictEqual(sepCells.length, 31); // 1 empty (Mon) + 30 days
assert.strictEqual(sepCells[0], null);   // T2 empty
assert.strictEqual(sepCells[1], 1);      // T3 is day 1
assert.strictEqual(sepCells[30], 30);    // Last cell is day 30
console.log("--- TEST 5: Grid cells and layout offset generation PASS ---");

console.log("=== ALL CALENDAR GRID UNIT TESTS PASSED 100% ===");
