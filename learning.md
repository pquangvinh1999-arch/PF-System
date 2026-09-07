# LEARNING.md — Nhật ký bài học kỹ thuật (dự án "Vén")

> Mỗi khi Subagent-QC báo FAIL và Agent chính đã sửa xong, BẮT BUỘC ghi 1 mục mới vào đây theo đúng format ở AGENT.md mục 4, trước khi chạy lại QC.

<!-- Ví dụ format — xoá dòng này khi có bài học thật đầu tiên
## [2026-09-07 10:00] — Task: 3.5.2
- **Lỗi gặp phải**: ...
- **Nguyên nhân gốc rễ**: ...
- **Cách sửa**: ...
- **Bài học rút ra**: ...
-->

## [2026-09-07 07:41:42Z] — Task: 0.3
- **Lỗi gặp phải**: Subagent-QC từ chối Task 0.3 do vi phạm QC-Gate: (1) Thiếu entity `Report` trong `src/types/index.ts` theo PLAN.md mục 4; (2) Entity `PlannedExpense` không khớp chính xác các trường trong DESIGN.md mục 4 (thiếu trường `status: "upcoming" | "paid" | "overdue"`, trường `recurrence` bị lệch tên thành `recurrence_type/is_recurring`, trường `note` bị thành `notes`).
- **Nguyên nhân gốc rễ**: Khi tạo file `src/types/index.ts`, Agent đã tự suy đoán một số tên thuộc tính (như `notes`, `is_paid`) thay vì sao chép chuẩn từng trường chữ cái một từ spec của `DESIGN.md` mục 4 và bỏ quên entity `Report` ở cuối `PLAN.md` mục 4.
- **Cách sửa**: Cập nhật lại `src/types/index.ts`: (1) Định nghĩa đầy đủ interface `Report` với đầy đủ số liệu thống kê thu chi, tỷ lệ tiết kiệm; (2) Chuẩn hóa 100% các trường của `PlannedExpense` thành `id, title, amount, due_date, category, account_id, recurrence ("none" | "monthly" | "yearly"), linked_goal_id, status ("upcoming" | "paid" | "overdue"), note`. Đồng bộ lại trong `src/store/index.ts`.
- **Bài học rút ra**: Luôn mở file spec (`PLAN.md`, `DESIGN.md`) đối chiếu trực tiếp từng tên trường (field name) và kiểu dữ liệu trước khi hoàn tất task Data Model; tuyệt đối không tự điều chỉnh hoặc viết theo thói quen cá nhân.

## [2026-09-07 11:00:00Z] — Task: 7.1/7.3
- **Lỗi gặp phải**: `tsc --noEmit` báo 3 lỗi: (1) `ProfileScreen.tsx(107,44): Expected 0 arguments, but got 1` — gọi `SyncService.local.push(payload)` trong khi signature khai báo 0 tham số; (2) `backupService.ts: Cannot find name 'Buffer'` (2 chỗ) — dùng trực tiếp Node `Buffer` trong code React Native không có `@types/node`; (3) `'c' is of type 'unknown'` ở `Uint8Array.from(bin, (c) => ...)`.
- **Nguyên nhân gốc rễ**: Viết service chạy cả 2 môi trường (RN Hermes + Node test) nhưng dùng API đặc thù Node (`Buffer`) và quên đồng bộ signature interface khi caller truyền thêm tham số; callback không annotate kiểu nên `noImplicitAny` suy ra `unknown`.
- **Cách sửa**: (1) Đổi `LocalOnlySyncProvider.push()` thành `push(_payload?: BackupPayload)`; (2) bọc truy cập Buffer qua helper `nodeBuffer(): any { return (globalThis as any).Buffer; }`, ưu tiên `btoa/atob` có sẵn trên Hermes; (3) annotate `(c: string)` cho callback `Uint8Array.from`.
- **Bài học rút ra**: Mọi service dùng chung RN + Node test phải truy cập API đặc thù nền tảng qua `(globalThis as any)` và luôn chạy `npx tsc --noEmit` ngay sau khi tạo file mới trước khi viết test tiếp theo.
