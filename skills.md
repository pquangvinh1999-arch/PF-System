# SKILLS.md — Kỹ năng kỹ thuật bắt buộc cho từng phase (app "Vén")

> Agent BẮT BUỘC đọc mục kỹ năng tương ứng trước khi code task thuộc phase đó. Nếu thiếu kỹ năng/thông tin kỹ thuật, phải dừng lại và hỏi user (theo AGENT.md), không được tự suy đoán.

---

## Nhóm A — Nền tảng dự án (Phase 0)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc trước khi code |
|---|---|---|
| Expo + React Native + TypeScript scaffold | Setup project | Đọc doc chính thức Expo (`expo init`, cấu trúc thư mục chuẩn) |
| EAS Build config | Build APK/IPA | File `eas.json` chuẩn: profile `development`, `preview`, `production` |
| SQLite schema design | Setup DB | Đối chiếu đúng data model trong `PLAN.md` mục 4 và `DESIGN.md` mục 4 (PlannedExpense) trước khi viết migration đầu tiên |
| React Navigation | Điều hướng | Xác định rõ stack/tab trước khi code (Bottom Tab: Dashboard·Calendar·Ví·Báo cáo·Cá nhân) |

## Nhóm B — Nhập liệu & Dashboard (Phase 1)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| CRUD form + validation (react-hook-form hoặc tương đương) | Nhập giao dịch | Danh mục & field bắt buộc phải khớp entity `Transaction` trong PLAN.md |
| Tách logic 2 tài khoản (Personal/Business) | Dashboard | Đọc DESIGN.md mục 3 — không được gộp 2 dòng tiền chung 1 số dư |
| State management (Zustand/Redux Toolkit) | Quản lý state toàn app | Thiết kế store theo entity, không tạo state trùng lặp dữ liệu DB |

## Nhóm C — Budget 50/30/20 (Phase 2)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| Toán tài chính cơ bản (tính % phân bổ, cảnh báo vượt ngưỡng) | Budget module | Công thức đúng chuẩn: % tùy chỉnh theo user, KHÔNG hard-code cố định 50/30/20 |
| Biểu đồ (Victory Native / react-native-svg-charts) | Hiển thị phân bổ | Dùng đúng token màu ở DESIGN.md mục 2 |

## Nhóm D — Profit First cho kinh doanh (Phase 3)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| Logic Profit First (Mike Michalowicz) | Auto-allocation doanh thu | Thứ tự trích: Profit → Thuế → Lương chủ → Vận hành. KHÔNG tự đổi thứ tự này nếu user chưa yêu cầu |
| Tách tài khoản (ledger riêng cho business) | Ví Kinh doanh | Business account KHÔNG được hiển thị gộp vào tổng ngân sách cá nhân ở Dashboard |

## Nhóm E — Calendar / Lịch chi tiêu xa (Phase 3.5 — tính năng thay Map)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| Thư viện calendar (react-native-calendars) | CalendarGrid | Custom marking dot theo DESIGN.md mục 4 |
| Thuật toán Cash Flow Forecast | CashFlowForecastBar | Công thức chính xác nêu ở DESIGN.md mục 4 — không tự chế công thức khác |
| Local notification (expo-notifications) | Nhắc hạn PlannedExpense | Nhắc trước N ngày (mặc định 7 ngày, có thể chỉnh) |

## Nhóm F — Mục tiêu & Quỹ khẩn cấp (Phase 4)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| Progress ring / progress bar | GoalCard | Emergency Fund target = 3-6 tháng chi phí thiết yếu, TÍNH TỰ ĐỘNG từ lịch sử Transaction, không để user tự nhập tùy ý nếu chưa có dữ liệu lịch sử |

## Nhóm G — Quản lý nợ (Phase 5)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| Thuật toán Snowball & Avalanche | Debt module | Snowball = sắp xếp theo số dư tăng dần; Avalanche = sắp xếp theo lãi suất giảm dần. Cả 2 phải có, cho user chọn |

## Nhóm H — Báo cáo (Phase 6)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| Tổng hợp & group-by theo category/thời gian | Report module | Không tính gộp Business + Personal trừ khi user chọn view "Tổng hợp gia đình" |
| Export PDF/CSV | Xuất báo cáo | Dùng thư viện đã kiểm chứng, test file xuất ra mở được thật (không chỉ code chạy không lỗi) |

## Nhóm I — Bảo mật (Phase 7)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| expo-local-authentication (PIN/FaceID/TouchID) | Khóa app | Test trên thiết bị thật cả Android & iOS, không chỉ trên simulator |
| Backup/Restore local DB | An toàn dữ liệu | Có cơ chế export file backup mã hoá, không lưu plaintext số tiền ra file dễ đọc |

## Nhóm J — Build & Release (Phase 8)

| Kỹ năng | Cần cho task | Tham chiếu bắt buộc |
|---|---|---|
| EAS Build Android/iOS | Build APK/IPA | Build `preview` trước, test kỹ, mới build `production` |
| Chuẩn bị metadata store | Submit app | Icon/favicon đúng theo DESIGN.md mục 1 (đồng bộ tên "Vén") |

---

## Nguyên tắc chung áp dụng cho MỌI nhóm kỹ năng
1. Không dùng thư viện ngoài danh sách đã liệt kê ở đây mà không xin phép — nếu cần thư viện mới, phải dừng lại hỏi user và ghi lý do vào `state.json`
2. Mọi công thức tài chính (Budget %, Profit First, Cash Flow Forecast, Snowball/Avalanche) phải khớp chính xác với PLAN.md và DESIGN.md — không tự sáng tạo công thức khác dù "nhìn hợp lý hơn"
3. Task nào cần kỹ năng chưa có trong bảng trên → dừng lại, không code mò, báo cáo cho user bổ sung skill/tài liệu tham chiếu
