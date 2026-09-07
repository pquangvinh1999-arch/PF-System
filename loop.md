# LOOP.md — Vòng lặp tự động hóa Coding ⇄ QC (Dự án "Vén")

> **Tôn chỉ vận hành**: Vòng lặp này chạy **hoàn toàn tự động và liên tục** từ Phase 0 đến Phase cuối cùng trong `PLAN.md`.
> **TUYỆT ĐỐI KHÔNG DỪNG LẠI HỎI USER SAU MỖI TASK HOẶC SAU MỖI PHASE**.
> Việc hoàn thành một Phase KHÔNG PHẢI là điều kiện dừng — Agent phải tự động chuyển sang Phase tiếp theo và tiếp tục thực thi cho đến khi hoàn tất 100% dự án và tiến hành bàn giao.

---

## 1. Sơ đồ chu trình tự động (Non-Stop Autonomous Loop)

```
╔════════════════════════════════════════════════════════════════════════════════════════╗
║                                    BẮT ĐẦU LOOP                                       ║
╚════════════════════════════════════════════════════════════════════════════════════════╝
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [1] LOAD CONTEXT                                                                       │
│     - Đọc state.json (xác định phase hiện tại, task hiện tại, pending_questions)       │
│     - Đọc PLAN.md, SKILLS.md, DESIGN.md, LEARNING.md, setting.json                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [2] XÁC ĐỊNH TASK & PHASE TIẾP THEO                                                    │
│     - Tìm task đầu tiên có status "pending" trong phase hiện tại.                      │
│     - Nếu phase hiện tại đã xong hết task:                                             │
│         * Đánh dấu phase hiện tại = "done" trong state.json.                           │
│         * TỰ ĐỘNG chuyển sang phase kế tiếp (current_phase = next_phase).              │
│         * Lấy task đầu tiên của phase mới — KHÔNG HỎI USER XÁC NHẬN.                   │
│     - Nếu toàn bộ các phase trong PLAN.md đều đã "done":                               │
│         * Chuyển thẳng sang bước [9] BÀN GIAO DỰ ÁN.                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [3] PRE-FLIGHT CHECK: ĐỦ THÔNG TIN & ĐÚNG THẨM QUYỀN CHƯA?                            │
│     - Đối chiếu yêu cầu task với SKILLS.md, DESIGN.md, PLAN.md:                        │
│         * NẾU THIẾU THÔNG TIN / SPEC MƠ HỒ:                                            │
│             → Ghi câu hỏi cụ thể vào state.json.pending_questions                      │
│             → DỪNG LOOP, thông báo rõ ràng cho user và chờ phản hồi                    │
│         * NẾU CẦN THAY ĐỔI CỐT LÕI (Kiến trúc lớn, công thức tài chính ngoài spec):    │
│             → Đề xuất giải pháp, hỏi xác nhận từ user (theo setting.json)              │
│             → DỪNG LOOP, chờ user duyệt                                                │
│         * NẾU ĐỦ THÔNG TIN: Tự động tiếp tục sang bước [4]                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [4] TRIỂN KHAI CODE (CODING TASK)                                                      │
│     - Áp dụng quyền Full Access theo setting.json (tự động tạo/sửa file, chạy lệnh).   │
│     - Code đúng phạm vi task hiện tại, chuẩn TypeScript, chuẩn Design Tokens & Schema. │
│     - Nghiêm cấm code lấn sang phạm vi task khác.                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [5] GỌI SUBAGENT-QC ĐỘC LẬP                                                            │
│     - Khởi chạy Subagent-QC kiểm tra theo QC-Gate (AGENT.md mục 3).                    │
│     - Subagent-QC thực hiện build/test/type-check thật:                                │
│         * Build pass, Type-check pass (tsc --noEmit)                                   │
│         * Lint pass, Unit test số học (nếu có logic tài chính)                         │
│         * Khớp Design Tokens, đúng Data Model, Regression check                        │
│     - Nhận kết quả JSON khách quan: { task_id, status, failed_checks, log }            │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [6] XỬ LÝ KẾT QUẢ QC                                                                   │
│     ├─ NẾU FAIL:                                                                       │
│     │    * Phân tích log lỗi thật từ Subagent-QC.                                      │
│     │    * Sửa mã nguồn tận gốc.                                                       │
│     │    * Ghi bài học vào LEARNING.md đúng format AGENT.md mục 4.                     │
│     │    * Quay lại bước [5] gọi Subagent-QC thẩm định lại (LẶP ĐẾN KHI PASS).          │
│     │    * (Nếu fail liên tục > 3 lần cùng 1 nguyên nhân → DỪNG LOOP báo cáo user).    │
│     │                                                                                  │
│     └─ NẾU PASS:                                                                       │
│          * Thu thập bằng chứng (logs/test output).                                     │
│          * Ghi mục hoàn thành vào REPORT.md đúng format AGENT.md mục 5.                │
│          * Cập nhật state.json: task hiện tại = "done".                                │
│          * TỰ ĐỘNG CHUYỂN BƯỚC [7] — KHÔNG HỎI LẠI USER.                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [7] CẬP NHẬT TRẠNG THÁI & CHUYỂN PHASE TỰ ĐỘNG                                         │
│     - Cập nhật state.json (last_updated, notes).                                       │
│     - Kiểm tra: Toàn bộ task trong Phase hiện tại đã "done"?                           │
│         * Nếu ĐÚNG: Đánh dấu Phase = "done". Tự động trỏ sang Phase kế tiếp.           │
│         * TUYỆT ĐỐI KHÔNG DỪNG LẠI HỎI: \"Phase đã xong, có tiếp tục không?\"           │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [8] LẶP TIẾP NGAY LẬP TỨC ───► QUAY LẠI BƯỚC [2]                                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼ (Khi tất cả phase hoàn thành)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [9] HOÀN TẤT & BÀN GIAO DỰ ÁN                                                          │
│     - Toàn bộ các Phase từ Phase 0 đến Phase 8 trong PLAN.md đều đã "done".            │
│     - Tổng kết toàn bộ REPORT.md thành hồ sơ nghiệm thu hoàn chỉnh.                    │
│     - Thông báo chính thức cho User: Dự án đã hoàn thành toàn bộ, đính kèm bàn giao.   │
│     - KẾT THÚC LOOP.                                                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Quy tắc chuyển Phase tự động (Zero-Interruption Phase Transition)

1. **Phase chỉ là mốc gom nhóm nghiệp vụ, KHÔNG PHẢI là rào cản dừng lại.**
2. Khi task cuối cùng của Phase N đạt **QC PASS**:
   - Ghi nhận `REPORT.md` cho task đó.
   - Cập nhật `state.json`: chuyển Phase N thành `"status": "done"`.
   - Ngay lập tức gán `current_phase = Phase N+1` và `current_task = Task đầu tiên của Phase N+1`.
   - **Tiếp tục ngay lập tức chu trình coding và QC cho Task mới mà không in prompt hỏi user hay chờ xác nhận.**
3. **Các hành vi bị nghiêm cấm**:
   - CẤM hỏi: *"Phase N đã hoàn thành, bạn có muốn tiếp tục Phase N+1 không?"*
   - CẤM dừng lại sau mỗi Phase để chờ lệnh từ user nếu không có lỗi hay thiếu thông tin spec.

---

## 3. Các điều kiện DỪNG LOOP duy nhất (Strict Interruption Triggers)

Vòng lặp CHỈ ĐƯỢC PHÉP dừng lại và tương tác với user trong đúng 4 trường hợp sau:

1. **Thiếu thông tin / Yêu cầu mơ hồ**: Khi đọc spec (`PLAN.md`, `DESIGN.md`, `SKILLS.md`) phát hiện thiếu thông tin quan trọng không thể tự quyết định mà không rủi ro sai lệch nghiệp vụ.
2. **Cần xác nhận đề xuất quan trọng**: Khi phát sinh đề xuất thay đổi kiến trúc cốt lõi, thay đổi công thức tài chính đã chốt, hoặc các thao tác ngoại vi rủi ro cao (theo quy định trong `setting.json`).
3. **QC fail lặp lại > 3 lần cùng 1 nguyên nhân**: Khi Subagent-QC từ chối cùng một lỗi quá 3 lần liên tiếp, báo hiệu có thể spec hoặc kiến trúc nền tảng gặp xung đột cần user can thiệp.
4. **Hoàn tất 100% dự án**: Khi tất cả các Phase trong `PLAN.md` đều đã hoàn thành và đạt chuẩn QC, Agent dừng loop để bàn giao sản phẩm.

---

## 4. Kỷ luật thực thi trong Loop

- **Không bỏ qua Subagent-QC**: Dù là task cấu hình nhỏ nhất, vẫn phải chạy QC thật qua Subagent độc lập.
- **Không tự chứng nhận "Pass"**: Kết quả Pass chỉ có giá trị khi log thật từ Subagent-QC xác nhận `status: "pass"`.
- **Không gộp task**: Mỗi task phải được code, kiểm thử, ghi report và cập nhật state riêng rẽ theo thứ tự.
- **Ghi nhật ký đầy đủ**:
  - Khi sửa lỗi sau QC fail: Bắt buộc ghi `LEARNING.md` đủ 4 mục (Lỗi, Nguyên nhân, Cách sửa, Bài học).
  - Khi task pass: Bắt buộc ghi `REPORT.md` kèm bằng chứng thực thi.
