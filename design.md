# DESIGN.md — Hệ thống thiết kế app "Vén"

> Vén — vén khéo dòng tiền của bạn.
> Tài liệu này biến tấu từ mẫu Figma "GOJEK UI Design – Online Transportation and Services Mobile App (Community)" sang app quản lý tài chính cá nhân, khớp với kiến trúc dữ liệu trong `PLAN.md`.

---

## 1. Thương hiệu

| Mục | Giá trị |
|---|---|
| Tên | **Vén** |
| Tagline | "Vén khéo dòng tiền của bạn" |
| Ý nghĩa | Từ "vén khéo" — sự khéo léo, tinh gọn trong thu vén chi tiêu gia đình |
| Giọng điệu thương hiệu | Ấm áp, tin cậy, không phô trương — đối lập với hình ảnh "app ngân hàng lạnh lùng" |

### Favicon / App Icon
- **Hình dạng**: chữ "V" được cách điệu thành 2 nét gấp giống nếp gấp ví da / lá cây non — vừa gợi "ví tiền", vừa gợi "tăng trưởng"
- **Bố cục**: đặt trong khối bo góc (squircle) 2 màu gradient nhẹ từ Primary → Accent
- **Biến thể**: icon đơn sắc (monochrome) cho favicon nhỏ 16-32px, icon đầy đủ gradient cho app icon 512px+

---

## 2. Design Tokens

```css
:root {
  /* Màu chính */
  --color-primary: #0F6E5B;      /* xanh ngọc đậm - tin cậy, tăng trưởng */
  --color-primary-light: #E4F1EC;
  --color-accent: #D4A72C;       /* vàng đồng - thịnh vượng, tiết kiệm */
  --color-accent-light: #FBF1DA;

  /* Trạng thái */
  --color-success: #1E8E5A;
  --color-warning: #E0972B;
  --color-danger: #D64545;

  /* Nền & chữ */
  --color-bg: #F7F5F0;           /* nền ấm, không trắng lạnh */
  --color-surface: #FFFFFF;
  --color-text-primary: #1C1C1C;
  --color-text-secondary: #6B6B6B;
  --color-border: #E7E4DD;

  /* Business account (tách biệt trực quan với personal) */
  --color-business-tag: #4A5FD1;
}
```

- **Font**: Be Vietnam Pro (chữ Việt đẹp, hỗ trợ dấu tốt) — heading dùng SemiBold, body dùng Regular/Medium
- **Bo góc**: 16px cho card, 12px cho button, 24px cho bottom sheet
- **Khoảng cách**: hệ 4px (4/8/12/16/24/32)

---

## 3. Mapping màn hình: Gojek Community Template → Vén

Mẫu gốc là app dịch vụ vận chuyển/giao đồ ăn dạng community (bottom nav, grid dịch vụ, bản đồ theo dõi đơn, ví). Biến tấu như sau:

| Màn hình gốc (Gojek) | Vai trò gốc | → Màn hình mới (Vén) | Vai trò mới |
|---|---|---|---|
| Splash / Onboarding | Giới thiệu app | Splash / Onboarding | Giới thiệu + hỏi nguồn thu nhập ban đầu (lương, kinh doanh) |
| Home (grid dịch vụ: đặt xe, giao đồ ăn, ví...) | Chọn dịch vụ | **Dashboard** | Tổng quan số dư 2 tài khoản (Cá nhân / Kinh doanh), thẻ nhanh: Ngân sách, Mục tiêu, Nợ |
| **Map (theo dõi tài xế real-time)** | Định vị, theo dõi đơn | **→ Calendar (Lịch chi tiêu xa)** | Xem/thêm các khoản chi lớn đã biết trước theo ngày (đám tiệc, học phí, bảo hiểm...) để phân bổ dòng tiền |
| Order detail | Chi tiết đơn hàng | Transaction detail | Chi tiết 1 giao dịch thu/chi |
| Wallet / Top-up | Nạp tiền, xem số dư | Accounts (Ví) | Danh sách tài khoản: Cá nhân, Kinh doanh (shop), mỗi tài khoản có breakdown Profit First nếu là business |
| Promo / Voucher | Khuyến mãi | Insights (Báo cáo) | Biểu đồ so sánh ngân sách vs thực tế, xu hướng tiết kiệm |
| Profile | Hồ sơ người dùng | Profile & Settings | Cài đặt bảo mật (PIN/FaceID), tỷ lệ Profit First, tỷ lệ 50/30/20 tùy chỉnh |

**Bottom Navigation mới**: `Dashboard · Calendar · Ví · Báo cáo · Cá nhân`

---

## 4. Chi tiết tính năng thay thế: Map → Calendar (Lịch chi tiêu xa)

### Mục tiêu
Thay vì theo dõi vị trí tài xế real-time, màn hình này giúp người dùng **nhìn trước** các khoản chi lớn, không định kỳ, đã biết ngày (đám tiệc cuối tháng, đóng học phí, bảo hiểm năm...) để chủ động phân bổ dòng tiền trước khi tiêu hết vào chi tiêu thường ngày.

### Bố cục
1. **Lịch tháng dạng lưới** (giữ layout "bản đồ toàn màn hình" của bản gốc, thay bằng calendar grid full-width)
   - Ngày có khoản chi đã lên lịch → chấm màu Accent (vàng đồng), số tiền hiển thị nhỏ dưới ngày nếu đủ chỗ
   - Ngày hôm nay → viền Primary
2. **Thanh dự báo dòng tiền (Cash Flow Forecast bar)** ở trên cùng, giống vị trí thanh tìm kiếm địa điểm ở bản gốc:
   - Hiển thị: "Số dư dự kiến cuối tháng sau khi trừ các khoản đã lên lịch: **X đ**"
   - Đổi màu: xanh (đủ), vàng (sát), đỏ (âm quỹ dự kiến)
3. **Bottom sheet chi tiết ngày** (thay cho bottom sheet "chi tiết tài xế" ở bản gốc): khi bấm vào 1 ngày → hiện danh sách khoản chi đã lên lịch của ngày đó + nút "Thêm khoản chi dự kiến"
4. **Form thêm "Khoản chi dự kiến"**:
   - Tên khoản chi, Số tiền, Ngày, Danh mục, Tài khoản áp dụng (Cá nhân/Kinh doanh), Lặp lại (không/hàng tháng/hàng năm), Ghi chú
   - Liên kết tùy chọn tới 1 Goal đã có (ví dụ: khoản chi này trừ vào quỹ "Dự phòng đám tiệc")

### Entity dữ liệu mới (bổ sung vào kiến trúc ở PLAN.md)

```
PlannedExpense
 ├─ id
 ├─ title              (vd: "Đám cưới bạn A")
 ├─ amount
 ├─ due_date
 ├─ category
 ├─ account_id          (personal | business)
 ├─ recurrence          (none | monthly | yearly)
 ├─ linked_goal_id       (nullable — liên kết Goal nếu có)
 ├─ status              (upcoming | paid | overdue)
 └─ note
```

Logic dự báo dòng tiền (Cash Flow Forecast) = `Số dư hiện tại + Thu nhập dự kiến còn lại trong tháng − Tổng PlannedExpense chưa "paid" trong tháng − Ngân sách chi tiêu còn lại theo kế hoạch Budget`.

---

## 5. Component Library cần dựng

| Component | Ghi chú |
|---|---|
| `BalanceCard` | Thẻ số dư, có biến thể Personal / Business (đổi màu tag) |
| `CalendarGrid` | Lưới lịch tháng, chấm đánh dấu ngày có sự kiện |
| `CashFlowForecastBar` | Thanh dự báo, đổi màu theo ngưỡng |
| `TransactionRow` | Dòng giao dịch (icon danh mục, tên, số tiền, +/-) |
| `BudgetProgressBar` | Thanh tiến độ ngân sách theo nhóm (50/30/20) |
| `ProfitFirstBreakdown` | Biểu đồ chia % khi nhập doanh thu kinh doanh |
| `GoalCard` | Thẻ mục tiêu, progress ring |
| `DebtRow` | Dòng nợ, hiển thị thứ tự ưu tiên Snowball/Avalanche |
| `PlannedExpenseSheet` | Bottom sheet thêm/sửa khoản chi dự kiến |

---

## 6. Ghi chú kỹ thuật khi trích xuất từ file .fig gốc
File `.fig` gốc là định dạng nhị phân (Kiwi format) không thể đọc trực tiếp bằng text editor. Khi triển khai thực tế:
1. Mở file bằng Figma Desktop/Web để lấy chính xác tên layer, spacing, component đã có
2. Đối chiếu layer/component đó với bảng mapping ở mục 3
3. Giữ nguyên hệ thống spacing & bo góc của bản gốc nếu phù hợp, chỉ đổi màu theo token ở mục 2 và đổi nội dung/icon theo domain tài chính
