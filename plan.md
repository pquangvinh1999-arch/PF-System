# PLAN.md — App Quản Lý Tài Chính Cá Nhân (Personal Finance Manager)

> Kế hoạch build app quản lý tài chính cá nhân đa nền tảng (Android APK + iOS), áp dụng các kỹ năng quản lý tài chính chuẩn chuyên gia. Tài liệu này dùng làm input cho Antigravity CLI để triển khai từng task.

---

## 1. Tầm nhìn & Mục tiêu sản phẩm

Xây dựng một app cho phép hộ gia đình có **nhiều nguồn thu nhập** (lương cố định + doanh thu kinh doanh biến động) quản lý thu chi theo đúng phương pháp luận tài chính cá nhân hàng đầu:

- **Pay Yourself First** — trích tiết kiệm/đầu tư trước khi chi tiêu
- **50/30/20 Budgeting** (có thể tùy biến tỷ lệ)
- **Profit First** — tách dòng tiền kinh doanh khỏi tài chính cá nhân, trích % tự động theo từng khoản thu
- **Zero-based budgeting** — mỗi đồng thu nhập đều có "nhiệm vụ"
- **Emergency Fund Tracker** — theo dõi tiến độ quỹ khẩn cấp (3-6 tháng chi phí thiết yếu)
- **Debt Payoff** — hỗ trợ chiến lược Snowball / Avalanche
- **Đa nguồn thu nhập** — tách riêng thu nhập cố định (lương) và thu nhập biến động (kinh doanh phụ)

### Đối tượng người dùng chính
Cặp vợ chồng/cá nhân có thu nhập từ lương văn phòng + thu nhập phụ từ kinh doanh nhỏ lẻ (shop, dịch vụ...), muốn có 1 app duy nhất để quản lý cả hai dòng tiền.

---

## 2. Nguyên tắc thiết kế tính năng (mapping tới kỹ năng tài chính chuyên gia)

| Kỹ năng tài chính chuyên gia | Tính năng app tương ứng |
|---|---|
| Lập ngân sách 50/30/20 | Module Budget với 3 nhóm tùy chỉnh %, cảnh báo vượt ngân sách |
| Theo dõi dòng tiền đa nguồn | Multi-income source: Lương cố định / Doanh thu kinh doanh / Thu nhập khác |
| Profit First cho kinh doanh | Auto-allocation: mỗi khoản doanh thu shop tự động chia theo % (thuế, lợi nhuận, vận hành, dự phòng) |
| Quỹ khẩn cấp | Goal tracker riêng, hiển thị % hoàn thành so với mục tiêu 3-6 tháng chi phí |
| Quản lý nợ (Snowball/Avalanche) | Debt module: nhập các khoản nợ, app đề xuất thứ tự trả |
| Mục tiêu tài chính ngắn/trung/dài hạn | Goals module với deadline, số tiền mục tiêu, tiến độ |
| Đánh giá định kỳ | Báo cáo tháng/quý tự động, so sánh thực tế vs ngân sách |
| Đầu tư & đa dạng hóa | Investment tracker cơ bản (ghi nhận thủ công: tiết kiệm, cổ phiếu, quỹ...) |

---

## 3. Kiến trúc & Tech Stack đề xuất (build APK + iOS từ 1 codebase)

- **Framework**: React Native (Expo) — build được cả APK (Android) và IPA (iOS) từ 1 codebase, phù hợp để dùng với CLI agent
- **State management**: Zustand hoặc Redux Toolkit
- **Local DB**: SQLite (expo-sqlite) hoặc WatermelonDB — dữ liệu tài chính nhạy cảm nên ưu tiên lưu local trước, đồng bộ cloud sau (giai đoạn 2)
- **Biểu đồ**: Victory Native / react-native-svg-charts
- **Auth & bảo mật**: PIN code / Face ID / Touch ID (expo-local-authentication)
- **Build pipeline**: EAS Build (Expo Application Services) → xuất APK (Android) và build iOS (cần Apple Developer account để deploy TestFlight/App Store)

> Ghi chú khi dùng Antigravity CLI: chạy scaffold dự án Expo trước, sau đó giao từng task bên dưới cho CLI theo thứ tự phase.

---

## 4. Data Model cốt lõi

```
User
 ├─ IncomeSource (loại: fixed_salary | business_revenue | other)
 │    ├─ name, amount, frequency (monthly/irregular), date
 ├─ Account (personal | business) — tách bạch dòng tiền
 ├─ Transaction
 │    ├─ type: income | expense | transfer
 │    ├─ category, amount, date, account_id, income_source_id
 ├─ Budget
 │    ├─ period (month), category, allocated_%, allocated_amount
 ├─ ProfitFirstRule (chỉ áp dụng cho business account)
 │    ├─ category (tax | profit | opex | reserve), percentage
 ├─ Goal
 │    ├─ type: emergency_fund | short_term | mid_term | long_term
 │    ├─ target_amount, current_amount, deadline
 ├─ Debt
 │    ├─ name, balance, interest_rate, min_payment, strategy(snowball/avalanche)
 └─ Report (auto-generated monthly/quarterly summary)
```

---

## 5. Chia nhỏ Task theo Phase

### Phase 0 — Setup dự án
- [x] Scaffold project Expo (React Native) + TypeScript
- [x] Cấu hình EAS Build cho Android & iOS
- [x] Thiết lập cấu trúc thư mục (features/, components/, store/, db/)
- [x] Setup SQLite local DB + schema migration
- [x] Setup navigation (React Navigation): Onboarding → Dashboard → Tabs

### Phase 1 — Core: Nhập liệu thu chi
- [x] Màn hình Onboarding: nhập nguồn thu nhập (lương cá nhân, lương vợ/chồng, doanh thu kinh doanh)
- [x] CRUD Transaction (thêm/sửa/xóa khoản thu — chi)
- [x] Phân loại Category (ăn uống, nhà ở, đi lại, giải trí, kinh doanh...)
- [x] Tách 2 loại tài khoản: Personal Account & Business Account
- [x] Dashboard tổng quan: tổng thu / tổng chi / số dư theo tháng

### Phase 2 — Budgeting Module (50/30/20 tùy biến)
- [x] Cho phép tạo ngân sách theo % hoặc số tiền cố định cho từng nhóm (thiết yếu / cá nhân / tiết kiệm)
- [x] Cảnh báo khi chi tiêu 1 nhóm vượt % ngân sách
- [x] Biểu đồ tròn/thanh: phân bổ chi tiêu thực tế vs kế hoạch

### Phase 3 — Profit First cho dòng tiền kinh doanh
- [x] Thiết lập rule % tự động (thuế / lợi nhuận / vận hành / dự phòng) áp dụng cho Business Account
- [x] Khi nhập doanh thu kinh doanh → tự động chia theo rule, hiển thị breakdown
- [x] Báo cáo riêng cho dòng tiền kinh doanh (tách khỏi báo cáo cá nhân)

### Phase 4 — Mục tiêu & Quỹ khẩn cấp
- [x] Goal tracker: tạo mục tiêu (tên, số tiền, deadline, loại)
- [x] Progress bar riêng cho Emergency Fund (dựa trên 3-6 tháng chi phí thiết yếu tự tính từ lịch sử chi tiêu)
- [x] Gợi ý số tiền cần tiết kiệm/tháng để đạt mục tiêu đúng hạn

### Phase 5 — Quản lý nợ
- [x] CRUD khoản nợ (tên, số dư, lãi suất, trả tối thiểu)
- [x] Tính năng gợi ý chiến lược: Snowball (nợ nhỏ trước) hoặc Avalanche (lãi cao trước)
- [x] Lịch trả nợ dự kiến (timeline)

### Phase 6 — Báo cáo & Đánh giá định kỳ
- [x] Báo cáo tháng: thu/chi theo category, so sánh tháng trước
- [x] Báo cáo quý: xu hướng tiết kiệm, tỷ lệ tiết kiệm/thu nhập
- [x] Xuất báo cáo (PDF/CSV) để lưu trữ

### Phase 7 — Bảo mật & Đồng bộ
- [x] Khóa app bằng PIN / Face ID / Touch ID
- [x] (Tùy chọn) Đồng bộ cloud (Firebase/Supabase) để 2 vợ chồng cùng xem chung 1 ví gia đình
- [x] Backup/Restore dữ liệu local

### Phase 8 — Build & Release
- [x] Build APK bản test (EAS Build --platform android)
- [x] Build iOS bản test (EAS Build --platform ios, cần Apple Developer account)
- [x] Test trên thiết bị thật (Android + iOS)
- [x] Chuẩn bị assets (icon, splash screen, tên app, mô tả store)
- [x] Submit lên Google Play / TestFlight → App Store

---

## 6. Ưu tiên MVP (nếu muốn ra bản dùng thử sớm)

MVP tối thiểu để dùng được ngay cho nhu cầu hiện tại (2 vợ chồng + 1 shop):
1. Phase 0 (setup)
2. Phase 1 (nhập thu chi, tách 2 tài khoản personal/business)
3. Phase 2 (budget 50/30/20 cơ bản)
4. Phase 3 (Profit First cơ bản cho shop)
5. Phase 8 — build APK bản nội bộ để dùng thử

Các phase 4-7 có thể làm ở version 2.

---

## 7. Ghi chú khi triển khai bằng Antigravity CLI
- Giao từng task (checkbox ở trên) như 1 prompt riêng cho CLI, theo đúng thứ tự phase để tránh xung đột code
- Sau mỗi phase, chạy test thủ công trên Expo Go trước khi build APK/IPA chính thức
- Nên version hoá file này (commit vào repo) để track tiến độ — tick từng checkbox khi task hoàn thành
