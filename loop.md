# LOOP.md — Vòng lặp tự động hóa Coding ⇄ QC (dự án "Vén")

> Vòng lặp này chạy liên tục cho đến khi toàn bộ phase trong `PLAN.md` hoàn thành, KHÔNG dừng lại hỏi user giữa chừng trừ khi gặp điều kiện DỪNG ở bước 3.

```
BẮT ĐẦU LOOP
│
├─ [1] LOAD CONTEXT
│     - Đọc state.json (phase/task hiện tại, pending_questions, blockers)
│     - Đọc PLAN.md, SKILLS.md, DESIGN.md, LEARNING.md
│
├─ [2] CHỌN TASK TIẾP THEO
│     - Lấy task đầu tiên có status "pending" theo đúng thứ tự phase trong state.json
│     - Nếu không còn task pending nào → sang bước [9] HOÀN TẤT DỰ ÁN
│
├─ [3] KIỂM TRA ĐỦ THÔNG TIN CHƯA?
│     - Đối chiếu task với SKILLS.md + DESIGN.md
│     - Nếu THIẾU thông tin / mơ hồ / cần quyết định vượt phạm vi đã duyệt:
│         → Ghi câu hỏi cụ thể vào state.json.pending_questions
│         → DỪNG LOOP, thông báo user
│         → (loop chỉ tiếp tục lại ở bước [1] sau khi user trả lời)
│     - Nếu ĐỦ thông tin → tiếp tục bước [4]
│
├─ [4] CODING TASK
│     - Code đúng phạm vi task hiện tại, đúng SKILLS.md + DESIGN.md
│     - Không code lấn sang task khác
│     - Không dùng thư viện/logic ngoài phạm vi đã duyệt (xem setting.json)
│
├─ [5] GỌI SUBAGENT-QC
│     - Chạy QC-Gate checklist đầy đủ theo AGENT.md mục 3
│     - Nhận kết quả JSON thật: { task_id, status, failed_checks, log }
│
├─ [6] KIỂM TRA KẾT QUẢ QC
│     ├─ NẾU FAIL:
│     │     - Đọc log lỗi thật
│     │     - Tìm nguyên nhân gốc rễ, sửa code (quay lại phạm vi bước [4])
│     │     - Ghi bài học vào LEARNING.md (đúng format AGENT.md mục 4)
│     │     - Quay lại bước [5] — LẶP LẠI đến khi PASS
│     │     - (Nếu fail liên tục > 3 lần cùng 1 nguyên nhân → DỪNG LOOP, báo user)
│     │
│     └─ NẾU PASS:
│           - Chụp màn hình bằng chứng
│           - Ghi vào REPORT.md (đúng format AGENT.md mục 5)
│           - Cập nhật state.json: task hiện tại → status "done"
│           - TỰ ĐỘNG tiếp tục — KHÔNG hỏi lại user
│
├─ [7] CẬP NHẬT STATE
│     - Ghi lại state.json: current_task, last_updated, phase status nếu phase đã xong hết task
│
├─ [8] QUAY LẠI BƯỚC [2]
│
└─ [9] HOÀN TẤT DỰ ÁN
      - Tất cả phase trong PLAN.md đã "done"
      - Tổng hợp toàn bộ REPORT.md thành bản tóm tắt bàn giao
      - Thông báo user: dự án đã hoàn thành, đính kèm tóm tắt + đường dẫn REPORT.md
      - DỪNG LOOP
```

## Điều kiện DỪNG LOOP (bắt buộc, không được bỏ qua)

1. Thiếu thông tin / yêu cầu mơ hồ → dừng, hỏi user
2. Cần hành động thuộc danh sách `require_user_confirmation` trong `setting.json` → dừng, hỏi user
3. QC fail lặp lại quá 3 lần cùng nguyên nhân trên cùng 1 task → dừng, báo cáo user (nghi ngờ vấn đề kiến trúc/spec cần xem lại, không phải lỗi code đơn thuần)
4. Toàn bộ dự án hoàn thành → dừng, bàn giao

## Điều KHÔNG được làm trong loop

- Không bỏ qua bước gọi Subagent-QC dù task "trông đơn giản"
- Không tự đánh dấu task "done" khi chưa có kết quả QC pass thật
- Không gộp nhiều task lại code chung 1 lần rồi mới QC — phải QC từng task một
- Không tự sửa PLAN.md/DESIGN.md/SKILLS.md trong lúc chạy loop để "task dễ pass hơn"
