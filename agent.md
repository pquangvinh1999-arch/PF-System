# AGENT.md — Hiến pháp vận hành cho Agent coding dự án "Vén"

> Áp dụng cho Agent chính (coding) và các Subagent QC. Đây là quy tắc CỨNG, không được diễn giải lại theo hướng dễ dãi hơn.

---

## 0. Trước khi làm BẤT KỲ việc gì trong 1 phiên (session start checklist)

Agent chính PHẢI thực hiện tuần tự, không được bỏ bước:

1. Đọc `state.json` → biết đang ở phase nào, task nào, có câu hỏi tồn đọng (`pending_questions`) nào chưa được trả lời không
2. Nếu có `pending_questions` chưa trả lời → **DỪNG**, hỏi lại user, không code tiếp
3. Đọc `PLAN.md` → xác định đúng vị trí task hiện tại trong tổng thể phase
4. Đọc `SKILLS.md` → xác định kỹ năng/kỹ thuật/tham chiếu bắt buộc cho task này
5. Đọc `DESIGN.md` → xác định đúng spec UI/UX/data cho task này
6. Đọc `LEARNING.md` → rà soát các lỗi đã từng mắc, tránh lặp lại
7. Chỉ sau khi hoàn tất 6 bước trên mới được bắt đầu code

Nếu bất kỳ file nào ở trên thiếu thông tin cần thiết cho task hiện tại → coi như "thông tin chưa đủ", áp dụng điều 2 bên dưới.

---

## 1. Nguyên tắc về dữ liệu & phạm vi quyền hạn

1. **Không code khi dữ liệu/thông tin chưa đủ hoặc mơ hồ.** Phải dừng lại, đặt câu hỏi cụ thể cho user, ghi câu hỏi đó vào `state.json.pending_questions`, rồi chờ trả lời
2. **Không tự vượt quyền**: không tự đổi kiến trúc dữ liệu đã chốt ở PLAN.md/DESIGN.md, không tự đổi công thức tài chính ở SKILLS.md, không tự thêm/bớt phase, không tự xoá dữ liệu người dùng, không tự động deploy production nếu chưa được duyệt (xem `setting.json`)
3. **Không tự bịa code** (viết code giả/stub rồi báo là đã hoàn thiện). Nếu 1 phần chưa implement thật, phải đánh dấu rõ `// TODO: chưa implement` và KHÔNG được đánh dấu task đó là "pass" trong `state.json`
4. **Không tự bịa kết quả QC.** Kết quả pass/fail chỉ được lấy từ Subagent QC chạy thật (build log, test log thật). Agent chính không được tự chấm "pass" thay Subagent
5. **Không tự ý cài thêm thư viện** ngoài phạm vi đã duyệt trong `SKILLS.md` mà không hỏi và ghi chú lý do

---

## 2. Quy trình 1 task nhỏ (bắt buộc theo đúng thứ tự)

```
[Task N] 
  → Brainstorm/đánh giá kế hoạch task (đối chiếu PLAN.md, DESIGN.md, SKILLS.md)
  → Nếu thiếu thông tin → HỎI USER → chờ → mới tiếp tục
  → Code task N (chỉ đúng phạm vi task N, không lấn sang task khác)
  → Gọi Subagent-QC kiểm tra task N theo đúng QC-Gate (mục 3)
  → Nếu QC FAIL:
       - Agent chính đọc log lỗi thật từ Subagent-QC
       - Tìm nguyên nhân gốc rễ, sửa code
       - Ghi lại vào LEARNING.md theo đúng format (mục 4)
       - Gọi lại Subagent-QC để test lại — LẶP LẠI đến khi PASS
       - KHÔNG được bỏ qua bước ghi LEARNING.md dù đã sửa xong
  → Nếu QC PASS:
       - Chụp màn hình kết quả (evidence)
       - Ghi vào REPORT.md (mục 5)
       - Cập nhật `state.json`: đánh dấu task N hoàn thành, chuyển sang task N+1
       - TỰ ĐỘNG chuyển sang task tiếp theo — KHÔNG hỏi lại user xác nhận
[Task N+1] → lặp lại quy trình trên
```

---

## 3. QC-Gate — Tiêu chuẩn Subagent QC phải kiểm tra cho MỌI task

Subagent QC là 1 agent độc lập, KHÔNG được là chính agent vừa code task đó tự chấm điểm mình. Checklist tối thiểu:

- [ ] **Build pass**: project build thành công, không lỗi compile/type
- [ ] **Lint pass**: không có lỗi lint theo cấu hình dự án
- [ ] **Unit test pass**: các test case của task (nếu có logic tính toán — Budget, Profit First, Cash Flow Forecast, Snowball/Avalanche — bắt buộc phải có unit test số học đúng)
- [ ] **UI khớp DESIGN.md**: đúng token màu, đúng component, đúng bố cục đã mô tả
- [ ] **Data đúng schema**: đúng entity/field đã định nghĩa trong PLAN.md/DESIGN.md, không tự thêm/bớt field
- [ ] **Không phá vỡ task trước đó** (regression check): các màn hình/chức năng đã pass ở task trước vẫn hoạt động đúng

Subagent QC trả về JSON kết quả rõ ràng: `{ task_id, status: "pass"|"fail", failed_checks: [...], log: "..." }`. Agent chính CHỈ được coi task là pass khi có kết quả `status: "pass"` thật từ Subagent.

---

## 4. Format bắt buộc khi ghi vào LEARNING.md (mỗi khi QC fail rồi sửa xong)

```markdown
## [Ngày giờ] — Task: <task_id>
- **Lỗi gặp phải**: <mô tả lỗi cụ thể, kèm log nếu có>
- **Nguyên nhân gốc rễ**: <phân tích tại sao xảy ra>
- **Cách sửa**: <mô tả thay đổi đã thực hiện>
- **Bài học rút ra**: <quy tắc cụ thể để không lặp lại lỗi này, viết dạng có thể áp dụng cho task khác tương tự>
```

Không được ghi chung chung kiểu "đã sửa lỗi" — phải đủ 4 mục trên để có giá trị tra cứu về sau.

---

## 5. Format bắt buộc khi ghi vào REPORT.md (mỗi khi 1 task pass QC)

```markdown
## [Ngày giờ] — Task: <task_id> — ✅ PASS
- **Mô tả task**: <tóm tắt việc đã làm>
- **Bằng chứng**: <đường dẫn ảnh chụp màn hình / tên file screenshot>
- **Kết quả QC**: <tóm tắt checklist đã pass từ Subagent>
- **Ghi chú**: <nếu có edge case đặc biệt cần lưu ý>
```

REPORT.md là bằng chứng cuối cùng để chốt kết quả dự án — mọi task pass đều phải có mục tương ứng ở đây, không được bỏ sót.

---

## 6. Giới hạn giao tiếp với user

- Khi task đang chạy bình thường (QC pass liên tục) → agent KHÔNG hỏi lại user, tự động tiếp tục theo `LOOP.md`
- Khi gặp thông tin thiếu/mơ hồ, hoặc cần quyết định vượt phạm vi đã duyệt (đổi kiến trúc, cài lib mới, đổi công thức tài chính) → BẮT BUỘC dừng và hỏi, ghi câu hỏi vào `state.json.pending_questions`
- Khi hoàn thành toàn bộ các phase trong PLAN.md → dừng loop, tổng hợp bàn giao trong REPORT.md, thông báo user

---

## 7. Vai trò Subagent-QC (tách biệt khỏi Agent chính)

- Chỉ nhận đầu vào: mã nguồn của task vừa hoàn thành + QC-Gate checklist (mục 3)
- Chạy test/build thật, không được "tin tưởng" báo cáo miệng của Agent chính
- Trả kết quả khách quan, không chỉnh sửa code (không có quyền sửa code — chỉ có quyền chấm pass/fail và trả log)
- Nếu phát hiện Agent chính báo cáo sai (task đã "pass" nhưng thực tế build lỗi) → Subagent-QC có quyền revert trạng thái task đó về "fail" trong `state.json`
