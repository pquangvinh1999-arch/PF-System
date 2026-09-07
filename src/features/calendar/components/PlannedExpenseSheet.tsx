import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  PlannedExpense,
  PlannedExpenseRecurrence,
  PlannedExpenseStatus,
} from "../../../types";
import { useAppStore } from "../../../store/useAppStore";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Button } from "../../../components/Button";
import { NotificationService } from "../../../services/notificationService";

interface PlannedExpenseSheetProps {
  visible: boolean;
  expenseToEdit?: PlannedExpense | null;
  initialDate?: string;
  onClose: () => void;
  onSaved?: (expense: PlannedExpense) => void;
  onDeleted?: (id: string) => void;
}

export const PRESET_CATEGORIES = [
  "Đám tiệc / Sự kiện",
  "Học phí & Giáo dục",
  "Bảo hiểm năm",
  "Du lịch & Nghỉ dưỡng",
  "Mua sắm lớn / Thiết bị",
  "Nhà ở & Tiện ích",
  "Y tế & Sức khỏe",
  "Chi phí kinh doanh",
  "Chi tiêu khác",
];

export const PlannedExpenseSheet: React.FC<PlannedExpenseSheetProps> = ({
  visible,
  expenseToEdit,
  initialDate,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const addPlannedExpense = useAppStore((state) => state.addPlannedExpense);
  const updatePlannedExpense = useAppStore((state) => state.updatePlannedExpense);
  const deletePlannedExpense = useAppStore((state) => state.deletePlannedExpense);

  const isEditing = Boolean(expenseToEdit);

  const [title, setTitle] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [category, setCategory] = useState<string>(PRESET_CATEGORIES[0]);
  const [accountId, setAccountId] = useState<string>("personal");
  const [recurrence, setRecurrence] = useState<PlannedExpenseRecurrence>("none");
  const [status, setStatus] = useState<PlannedExpenseStatus>("upcoming");
  const [linkedGoalId, setLinkedGoalId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [remindDaysBefore, setRemindDaysBefore] = useState<number>(
    NotificationService.DEFAULT_REMIND_DAYS_BEFORE
  );
  const [enableReminder, setEnableReminder] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (visible) {
      setErrorMsg("");
      if (expenseToEdit) {
        setTitle(expenseToEdit.title);
        setAmount(expenseToEdit.amount.toString());
        setDueDate(expenseToEdit.due_date);
        setCategory(expenseToEdit.category || PRESET_CATEGORIES[0]);
        setAccountId(expenseToEdit.account_id || "personal");
        setRecurrence(expenseToEdit.recurrence || "none");
        setStatus(expenseToEdit.status || "upcoming");
        setLinkedGoalId(expenseToEdit.linked_goal_id || "");
        setNote(expenseToEdit.note || "");
        setEnableReminder(expenseToEdit.status !== "paid");
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        setTitle("");
        setAmount("");
        setDueDate(initialDate || todayStr);
        setCategory(PRESET_CATEGORIES[0]);
        setAccountId("personal");
        setRecurrence("none");
        setStatus("upcoming");
        setLinkedGoalId("");
        setNote("");
        setEnableReminder(true);
        setRemindDaysBefore(NotificationService.DEFAULT_REMIND_DAYS_BEFORE);
      }
    }
  }, [visible, expenseToEdit, initialDate]);

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg("Vui lòng nhập tên khoản chi dự kiến");
      return;
    }

    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ (> 0)");
      return;
    }

    const cleanDate = dueDate.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(cleanDate)) {
      setErrorMsg("Ngày đến hạn không đúng định dạng YYYY-MM-DD (ví dụ: 2026-09-25)");
      return;
    }

    try {
      let saved: PlannedExpense | null = null;
      if (isEditing && expenseToEdit) {
        saved = await updatePlannedExpense(expenseToEdit.id, {
          title: cleanTitle,
          amount: numAmount,
          due_date: cleanDate,
          category,
          account_id: accountId,
          recurrence,
          status,
          linked_goal_id: linkedGoalId.trim() || undefined,
          note: note.trim() || undefined,
        });
        if (saved) {
          onSaved?.(saved);
        }
      } else {
        saved = await addPlannedExpense({
          title: cleanTitle,
          amount: numAmount,
          due_date: cleanDate,
          category,
          account_id: accountId,
          recurrence,
          status,
          linked_goal_id: linkedGoalId.trim() || undefined,
          note: note.trim() || undefined,
        });
        onSaved?.(saved);
      }

      // Xử lý thông báo nhắc hạn (Local Notification)
      if (saved) {
        if (enableReminder && saved.status !== "paid") {
          await NotificationService.schedulePlannedExpenseReminder(
            saved,
            remindDaysBefore
          );
        } else if (saved.status === "paid") {
          await NotificationService.cancelNotification(saved.id);
        }
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu khoản chi dự kiến");
    }
  };

  const handleDelete = () => {
    if (!expenseToEdit) return;

    const performDelete = async () => {
      try {
        await NotificationService.cancelNotification(expenseToEdit.id);
        const success = await deletePlannedExpense(expenseToEdit.id);
        if (success) {
          onDeleted?.(expenseToEdit.id);
          onClose();
        } else {
          setErrorMsg("Không thể xoá khoản chi này");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Lỗi khi xoá");
      }
    };

    if (Platform.OS === "web") {
      if (confirm(`Bạn có chắc chắn muốn xoá khoản chi "${expenseToEdit.title}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Xác nhận xoá",
        `Bạn có chắc chắn muốn xoá khoản chi "${expenseToEdit.title}"?`,
        [
          { text: "Hủy", style: "cancel" },
          { text: "Xoá", style: "destructive", onPress: performDelete },
        ]
      );
    }
  };

  const handleToggleStatus = async () => {
    if (!expenseToEdit) return;
    const nextStatus: PlannedExpenseStatus =
      status === "paid" ? "upcoming" : "paid";
    setStatus(nextStatus);
    try {
      const updated = await updatePlannedExpense(expenseToEdit.id, {
        status: nextStatus,
      });
      if (updated) {
        onSaved?.(updated);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi cập nhật trạng thái");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* Sheet Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isEditing ? "Chỉnh Sửa Khoản Chi" : "Thêm Khoản Chi Dự Kiến"}
              </Text>
              <Text style={styles.subtitle}>
                Lên lịch trước để chủ động dòng tiền và dự báo cuối tháng
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick Status Toggle if Editing */}
            {isEditing && (
              <View style={styles.statusToggleBanner}>
                <View>
                  <Text style={styles.statusToggleTitle}>Trạng thái thanh toán</Text>
                  <Text style={styles.statusToggleSub}>
                    {status === "paid"
                      ? "Đã thanh toán (loại khỏi dự báo chi còn lại)"
                      : "Chưa thanh toán (tính vào dự báo dòng tiền)"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    status === "paid" ? styles.toggleBtnPaid : styles.toggleBtnUpcoming,
                  ]}
                  onPress={handleToggleStatus}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      status === "paid" && styles.toggleBtnTextPaid,
                    ]}
                  >
                    {status === "paid" ? "✓ Đã chi" : "⏳ Sắp tới"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên khoản chi *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vd: Đám cưới bạn A, Đóng học phí, Bảo hiểm..."
                placeholderTextColor={Colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Số tiền dự kiến (VNĐ) *</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Due Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày đến hạn (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-09-25"
                placeholderTextColor={Colors.textSecondary}
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            {/* Account Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tài khoản áp dụng *</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    accountId === "personal" && styles.pillActivePersonal,
                  ]}
                  onPress={() => setAccountId("personal")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      accountId === "personal" && styles.pillTextActive,
                    ]}
                  >
                    👤 Ví Cá nhân
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    accountId === "business" && styles.pillActiveBusiness,
                  ]}
                  onPress={() => setAccountId("business")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      accountId === "business" && styles.pillTextActive,
                    ]}
                  >
                    🏢 Shop / Kinh doanh
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Chips */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Danh mục chi tiêu *</Text>
              <View style={styles.chipsContainer}>
                {PRESET_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      category === cat && styles.chipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === cat && styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recurrence Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Lặp lại định kỳ</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    recurrence === "none" && styles.pillActivePrimary,
                  ]}
                  onPress={() => setRecurrence("none")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      recurrence === "none" && styles.pillTextActive,
                    ]}
                  >
                    Không lặp lại
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    recurrence === "monthly" && styles.pillActivePrimary,
                  ]}
                  onPress={() => setRecurrence("monthly")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      recurrence === "monthly" && styles.pillTextActive,
                    ]}
                  >
                    Hàng tháng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    recurrence === "yearly" && styles.pillActivePrimary,
                  ]}
                  onPress={() => setRecurrence("yearly")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      recurrence === "yearly" && styles.pillTextActive,
                    ]}
                  >
                    Hàng năm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    status === "upcoming" && styles.pillActiveWarning,
                  ]}
                  onPress={() => setStatus("upcoming")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      status === "upcoming" && styles.pillTextActive,
                    ]}
                  >
                    ⏳ Sắp tới
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    status === "paid" && styles.pillActiveSuccess,
                  ]}
                  onPress={() => setStatus("paid")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      status === "paid" && styles.pillTextActive,
                    ]}
                  >
                    ✓ Đã thanh toán
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    status === "overdue" && styles.pillActiveDanger,
                  ]}
                  onPress={() => setStatus("overdue")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      status === "overdue" && styles.pillTextActive,
                    ]}
                  >
                    ⚠️ Quá hạn
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Nhắc nhở hạn chi tiêu (Local Notification - SKILLS.md Nhóm E) */}
            <View style={styles.formGroup}>
              <View style={styles.reminderHeaderRow}>
                <Text style={styles.label}>🔔 Thông báo nhắc hạn trước</Text>
                <TouchableOpacity
                  onPress={() => setEnableReminder(!enableReminder)}
                  style={[
                    styles.reminderToggle,
                    enableReminder
                      ? styles.reminderToggleActive
                      : styles.reminderToggleInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderToggleText,
                      enableReminder && styles.reminderToggleTextActive,
                    ]}
                  >
                    {enableReminder ? "✓ Bật nhắc nhở" : "✕ Tắt"}
                  </Text>
                </TouchableOpacity>
              </View>

              {enableReminder && (
                <View style={styles.pillRow}>
                  {[1, 3, 7, 14].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.pill,
                        remindDaysBefore === days && styles.pillActivePrimary,
                      ]}
                      onPress={() => setRemindDaysBefore(days)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          remindDaysBefore === days && styles.pillTextActive,
                        ]}
                      >
                        {days === 7 ? "7 ngày (chuẩn)" : `${days} ngày`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Linked Goal (optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Liên kết Mục tiêu / Quỹ dự phòng (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên quỹ hoặc mã Goal (vd: goal_wedding)"
                placeholderTextColor={Colors.textSecondary}
                value={linkedGoalId}
                onChangeText={setLinkedGoalId}
              />
            </View>

            {/* Note */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ghi chú chi tiết</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ghi chú thêm về địa điểm, chi tiết chuyển khoản..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title={isEditing ? "Lưu Thay Đổi" : "Tạo Khoản Chi Dự Kiến"}
                onPress={handleSave}
                variant="primary"
                style={styles.mainActionBtn}
              />
              {isEditing && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>🗑️ Xoá khoản chi</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.bottomSheet, // 24px cho bottom sheet theo DESIGN.md
    borderTopRightRadius: BorderRadius.bottomSheet,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? Spacing.xl * 2 : Spacing.xl,
    maxHeight: "90%",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: "90%",
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: "bold",
  },
  errorBox: {
    backgroundColor: "#FDEDEC",
    padding: Spacing.sm,
    borderRadius: BorderRadius.button,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  statusToggleBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.bg,
    padding: Spacing.sm,
    borderRadius: BorderRadius.button,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusToggleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statusToggleSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  toggleBtnUpcoming: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  toggleBtnPaid: {
    backgroundColor: "#E4F7EC",
    borderWidth: 1,
    borderColor: Colors.success,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.warning,
  },
  toggleBtnTextPaid: {
    color: Colors.success,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  amountInput: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  pill: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  pillActivePrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillActivePersonal: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillActiveBusiness: {
    backgroundColor: Colors.businessTag,
    borderColor: Colors.businessTag,
  },
  pillActiveWarning: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  pillActiveSuccess: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  pillActiveDanger: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  actions: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  mainActionBtn: {
    width: "100%",
  },
  deleteBtn: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: "600",
  },
  reminderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  reminderToggle: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  reminderToggleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  reminderToggleInactive: {
    backgroundColor: Colors.bg,
    borderColor: Colors.border,
  },
  reminderToggleText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  reminderToggleTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
