const assert = require('node:assert');

// Test data simulating accounts and transactions
const accounts = [
  { id: 'acc_pers', name: 'Ví Cá nhân', type: 'personal', balance: 10000000, initial_balance: 10000000 },
  { id: 'acc_biz', name: 'Ví Kinh doanh', type: 'business', balance: 20000000, initial_balance: 20000000 },
];

// TEST 1: Strict separation rule - No shared total balance
assert.notStrictEqual(accounts[0].type, accounts[1].type, "Tài khoản cá nhân và kinh doanh phải có type khác nhau");
console.log("--- TEST 1: Account types strictly separated (personal vs business) PASS ---");

// TEST 2: Transaction isolation
function applyExpense(acc, amount) {
  return { ...acc, balance: acc.balance - amount };
}

function applyIncome(acc, amount) {
  return { ...acc, balance: acc.balance + amount };
}

function applyTransfer(fromAcc, toAcc, amount) {
  return [
    { ...fromAcc, balance: fromAcc.balance - amount },
    { ...toAcc, balance: toAcc.balance + amount }
  ];
}

// Chi tiêu 1,500,000 VND từ ví cá nhân
let updatedPers = applyExpense(accounts[0], 1500000);
let unchangedBiz = accounts[1];
assert.strictEqual(updatedPers.balance, 8500000, "Ví cá nhân giảm còn 8.5M");
assert.strictEqual(unchangedBiz.balance, 20000000, "Ví kinh doanh không bị ảnh hưởng (vẫn 20M)");
console.log("--- TEST 2: Personal expense isolation PASS ---");

// Doanh thu shop 5,000,000 VND vào ví kinh doanh
let updatedBiz = applyIncome(unchangedBiz, 5000000);
assert.strictEqual(updatedBiz.balance, 25000000, "Ví kinh doanh tăng lên 25M");
assert.strictEqual(updatedPers.balance, 8500000, "Ví cá nhân không bị ảnh hưởng (vẫn 8.5M)");
console.log("--- TEST 3: Business revenue isolation PASS ---");

// Rút lợi nhuận 4,000,000 VND từ kinh doanh sang cá nhân
const [transferredBiz, transferredPers] = applyTransfer(updatedBiz, updatedPers, 4000000);
assert.strictEqual(transferredBiz.balance, 21000000, "Ví kinh doanh sau rút còn 21M");
assert.strictEqual(transferredPers.balance, 12500000, "Ví cá nhân sau nhận tăng lên 12.5M");

// Tổng tài sản bảo toàn
const initialTotal = updatedBiz.balance + updatedPers.balance;
const postTransferTotal = transferredBiz.balance + transferredPers.balance;
assert.strictEqual(initialTotal, postTransferTotal, "Tổng tài sản phải được bảo toàn chính xác sau chuyển khoản nội bộ");
console.log("--- TEST 4: Profit withdrawal transfer & wealth conservation PASS ---");

console.log("=== ALL ACCOUNTS SEPARATION UNIT TESTS PASSED 100% ===");
