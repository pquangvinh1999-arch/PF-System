import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Goal, GoalType } from "../../../types";
import { GoalService, GOAL_TYPE_META, VALID_GOAL_TYPES } from "../../../services/goalService";
import { useAppStore } from "../../../store/useAppStore";

interface GoalFormModalProps {
  visible: boolean;
  goalToEdit?: Goal | null;
  contributeTo?: Goal | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const TYPE_ORDER: GoalType[] = ["emergency_fund", "short_term", "mid_term", "long_term"];

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  visible,
  goalToEdit,
  contributeTo,
  onClose,
  onSuccess,
}) => {
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);

  const isContributeMode = Boolean(contributeTo && !goalToEdit);

  const [name, setName] = useState("");
  const [type, setType] = useState<GoalType>("short_term");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setError("");
      setSaving(false);
      if (goalToEdit) {
        setName(goalToEdit.name);
        setType(goalToEdit.type);
        setTargetAmount(String(goalToEdit.target_amount));
        setCurrentAmount(String(goalToEdit.current_amount));
        setDeadline(goalToEdit.deadline || "");
        setContributeAmount("");
      } else if (contributeTo) {
        setName(contributeTo.name);
        setContributeAmount("");
      } else {
        setName("");
        setType("short_term");
        setTargetAmount("");
        setCurrentAmount("");
        setDeadline("");
        setContributeAmount("");
      }
    }
  }, [visible, goalToEdit, contributeTo]);

  const handleSave = async () => {
    setError("");
    if (isContributeMode && contributeTo) {
      const amt = Number(String(contributeAmount).replace(/[.\s,đ₫]/g, ""));
      if (isNaN(amt) || amt <= 0) {
        setError("Vui lòng nhập số tiền góp thêm hợp lệ (> 0)");
        return;
      }
      setSaving(true);
      try {
        const next = Number(contributeTo.current_amount) + amt;
        if (next > Number(contributeTo.target_amount)) {
          setError("Số tiền góp vượt quá mục tiêu. Hãy nhập số tiền nhỏ hơn.");
          setSaving(false);
          return;
        }
        await updateGoal(contributeTo.id, { current_amount: next });
        onSuccess?.();
        onClose();
      } catch (e) {
        setError("Không thể lưu. Vui lòng thử lại.");
      } finally {
        setSaving(false);
      }
      return;
    }

    const result = GoalService.validateGoalInput({
      name,
      type,
      targetAmount,
      currentAmount,
      deadline,
    });
    if (!result.isValid || !result.data) {
      setError(result.error || "Dữ liệu không hợp lệ");
      return;
    }
    setSaving(true);
    try {
      if (goalToEdit) {
        await updateGoal(goalToEdit.id, {
          name: result.data.name,
          type: result.data.type,
          target_amount: result.data.target_amount,
          current_amount: result.data.current_amount,
          deadline: result.data.deadline || null,
        });
      } else {
        await addGoal({
          name: result.data.name,
          type: result.data.type,
          target_amount: result.data.target_amount,
          current_amount: result.data.current_amount,
          deadline: result.data.deadline || null,
        });
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      setError("Không thể lưu mục tiêu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const title = isContributeMode
    ? `Góp thêm: ${contributeTo?.name}`
    : goalToEdit
      ? "Sửa mục tiêu"
      : "Thêm mục tiêu mới";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {isContributeMode
                ? "Nhập số tiền bạn vừa tích lũy thêm cho mục tiêu này"
                : "Đặt tên, số tiền, hạn hoàn thành và loại mục tiêu"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isContributeMode ? (
                <View>
                  <Text style={styles.label}>Số tiền góp thêm (đ)</Text>
                  <TextInput
                    style={styles.input}
                    value={contributeAmount}
                    onChangeText={setContributeAmount}
                    keyboardType="numeric"
                    placeholder="Ví dụ: 1000000"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>Tên mục tiêu *</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ví dụ: Quỹ khẩn cấp 6 tháng, Mua xe máy..."
                    placeholderTextColor={Colors.textSecondary}
                    maxLength={80}
                  />

                  <Text style={styles.label}>Loại mục tiêu *</Text>
                  <View style={styles.typeGrid}>
                    {TYPE_ORDER.map((t) => {
                      const meta = GOAL_TYPE_META[t];
                      const active = type === t;
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[styles.typeChip, active && styles.typeChipActive]}
                          onPress={() => setType(t)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.typeIcon}>{meta.icon}</Text>
                          <Text style={[styles.typeText, active && styles.typeTextActive]}>
                            {meta.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.hint}>{GOAL_TYPE_META[type].hint}</Text>

                  <Text style={styles.label}>Số tiền mục tiêu (đ) *</Text>
                  <TextInput
                    style={styles.input}
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    keyboardType="numeric"
                    placeholder="Ví dụ: 50000000"
                    placeholderTextColor={Colors.textSecondary}
                  />

                  <Text style={styles.label}>Đã tích lũy (đ)</Text>
                  <TextInput
                    style={styles.input}
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                    keyboardType="numeric"
                    placeholder="Mặc định: 0"
                    placeholderTextColor={Colors.textSecondary}
                  />

                  <Text style={styles.label}>Hạn hoàn thành (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={deadline}
                    onChangeText={setDeadline}
                    placeholder="Ví dụ: 2026-12-31 (để trống nếu chưa có)"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              )}

              {Boolean(error) && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveText}>{saving ? "Đang lưu..." : "💾 Lưu"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetWrap: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.bottomSheet,
    borderTopRightRadius: BorderRadius.bottomSheet,
    padding: Spacing.lg,
    maxHeight: "88%",
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.bg,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: "italic",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
