import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Button, Badge, Card } from "../../../components";
import { useAppStore } from "../../../store/useAppStore";

interface Props {
  visible: boolean;
  period: string; // YYYY-MM
  onClose: () => void;
  onSuccess?: () => void;
}

export const BudgetConfigModal: React.FC<Props> = ({
  visible,
  period,
  onClose,
  onSuccess,
}) => {
  const budgets = useAppStore((state) => state.budgets);
  const incomeSources = useAppStore((state) => state.incomeSources);
  const saveBudgetRules = useAppStore((state) => state.saveBudgetRules);

  const [needsPercent, setNeedsPercent] = useState<string>("50");
  const [wantsPercent, setWantsPercent] = useState<string>("30");
  const [savingsPercent, setSavingsPercent] = useState<string>("20");
  const [expectedIncome, setExpectedIncome] = useState<string>("45000000");

  useEffect(() => {
    if (visible) {
      // Tìm budgets đã lưu của period
      const bNeeds = budgets.find((b) => b.group === "needs" || b.budget_group === "needs");
      const bWants = budgets.find((b) => b.group === "wants" || b.budget_group === "wants");
      const bSavings = budgets.find((b) => b.group === "savings" || b.budget_group === "savings");

      if (bNeeds && bWants && bSavings) {
        setNeedsPercent(bNeeds.allocated_percentage.toString());
        setWantsPercent(bWants.allocated_percentage.toString());
        setSavingsPercent(bSavings.allocated_percentage.toString());

        const totalAmt =
          bNeeds.allocated_amount + bWants.allocated_amount + bSavings.allocated_amount;
        if (totalAmt > 0) {
          setExpectedIncome(totalAmt.toString());
        }
      } else {
        // Tính tổng lương cá nhân từ incomeSources
        const personalTotal = incomeSources
          .filter((s) => s.type !== "business_revenue")
          .reduce((sum, s) => sum + s.amount, 0);

        if (personalTotal > 0) {
          setExpectedIncome(personalTotal.toString());
        }
        setNeedsPercent("50");
        setWantsPercent("30");
        setSavingsPercent("20");
      }
    }
  }, [visible, budgets, incomeSources]);

  const pNeeds = parseFloat(needsPercent) || 0;
  const pWants = parseFloat(wantsPercent) || 0;
  const pSavings = parseFloat(savingsPercent) || 0;
  const totalPercent = pNeeds + pWants + pSavings;
  const incomeNum = parseFloat(expectedIncome) || 0;

  const amtNeeds = Math.round((pNeeds / 100) * incomeNum);
  const amtWants = Math.round((pWants / 100) * incomeNum);
  const amtSavings = Math.round((pSavings / 100) * incomeNum);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  const applyPreset = (n: number, w: number, s: number) => {
    setNeedsPercent(n.toString());
    setWantsPercent(w.toString());
    setSavingsPercent(s.toString());
  };

  const handleSave = async () => {
    if (totalPercent !== 100) {
      Alert.alert("Lỗi tỷ lệ", `Tổng 3 nhóm phải bằng 100% (Hiện tại: ${totalPercent}%).`);
      return;
    }

    if (incomeNum <= 0) {
      Alert.alert("Lỗi thu nhập", "Vui lòng nhập số tiền thu nhập dự kiến hợp lệ.");
      return;
    }

    try {
      await saveBudgetRules(period, {
        needsPercentage: pNeeds,
        wantsPercentage: pWants,
        savingsPercentage: pSavings,
        expectedIncome: incomeNum,
      });

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt ngân sách.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Thiết lập Ngân sách 50/30/20</Text>
              <Text style={styles.headerSub}>Tùy biến tỷ lệ % cho {period}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Gợi ý mẫu phân bổ nhanh */}
            <Text style={styles.sectionLabel}>Chọn mẫu phân bổ nhanh</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  pNeeds === 50 && pWants === 30 && pSavings === 20 && styles.presetBtnActive,
                ]}
                onPress={() => applyPreset(50, 30, 20)}
              >
                <Text style={styles.presetTitle}>Chuẩn</Text>
                <Text style={styles.presetSub}>50 - 30 - 20</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  pNeeds === 40 && pWants === 20 && pSavings === 40 && styles.presetBtnActive,
                ]}
                onPress={() => applyPreset(40, 20, 40)}
              >
                <Text style={styles.presetTitle}>Tiết kiệm cao</Text>
                <Text style={styles.presetSub}>40 - 20 - 40</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  pNeeds === 60 && pWants === 25 && pSavings === 15 && styles.presetBtnActive,
                ]}
                onPress={() => applyPreset(60, 25, 15)}
              >
                <Text style={styles.presetTitle}>Gia đình trẻ</Text>
                <Text style={styles.presetSub}>60 - 25 - 15</Text>
              </TouchableOpacity>
            </View>

            {/* Thu nhập dự kiến cơ sở */}
            <Text style={styles.sectionLabel}>Thu nhập dự kiến hàng tháng (VNĐ) *</Text>
            <TextInput
              style={styles.input}
              placeholder="45000000"
              keyboardType="numeric"
              value={expectedIncome}
              onChangeText={setExpectedIncome}
            />

            {/* 3 Nhóm tùy biến % */}
            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>🏠 Thiết yếu (Needs)</Text>
                <View style={styles.percentInputRow}>
                  <TextInput
                    style={styles.percentInput}
                    keyboardType="numeric"
                    value={needsPercent}
                    onChangeText={setNeedsPercent}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>
              <Text style={styles.groupAmount}>= {formatCurrency(amtNeeds)}</Text>
              <Text style={styles.groupDesc}>
                Ăn uống, tiền nhà, điện nước, đi lại, y tế, con cái
              </Text>
            </View>

            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>🛍️ Cá nhân (Wants)</Text>
                <View style={styles.percentInputRow}>
                  <TextInput
                    style={styles.percentInput}
                    keyboardType="numeric"
                    value={wantsPercent}
                    onChangeText={setWantsPercent}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>
              <Text style={styles.groupAmount}>= {formatCurrency(amtWants)}</Text>
              <Text style={styles.groupDesc}>
                Mua sắm, giải trí, du lịch, cà phê, sở thích cá nhân
              </Text>
            </View>

            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>🛡️ Tiết kiệm (Savings)</Text>
                <View style={styles.percentInputRow}>
                  <TextInput
                    style={styles.percentInput}
                    keyboardType="numeric"
                    value={savingsPercent}
                    onChangeText={setSavingsPercent}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>
              <Text style={styles.groupAmount}>= {formatCurrency(amtSavings)}</Text>
              <Text style={styles.groupDesc}>
                Quỹ khẩn cấp, tích lũy mua nhà, đầu tư tài chính
              </Text>
            </View>

            {/* Tổng % validator */}
            <View
              style={[
                styles.validatorBox,
                totalPercent === 100 ? styles.validatorPass : styles.validatorFail,
              ]}
            >
              <Text
                style={[
                  styles.validatorText,
                  { color: totalPercent === 100 ? Colors.primary : Colors.danger },
                ]}
              >
                Tổng tỷ lệ: {totalPercent}% / 100% {totalPercent === 100 ? "✓ Hợp lệ" : "✗ Cần chỉnh lại"}
              </Text>
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Hủy"
                variant="outline"
                style={styles.cancelBtn}
                onPress={onClose}
              />
              <Button
                title="Lưu Ngân Sách"
                variant="primary"
                style={styles.saveBtn}
                onPress={handleSave}
              />
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.bottomSheet,
    borderTopRightRadius: BorderRadius.bottomSheet,
    maxHeight: "90%",
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  headerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  closeBtn: {
    padding: Spacing.sm,
  },
  closeText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  sectionLabel: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  presetRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.button,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  presetTitle: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  presetSub: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  groupCard: {
    backgroundColor: "#FAF9F6",
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  percentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.sm,
  },
  percentInput: {
    width: 44,
    height: 36,
    textAlign: "center",
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  percentSymbol: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  groupAmount: {
    ...Typography.bodyLarge,
    fontWeight: "800",
    color: Colors.primary,
    marginTop: 4,
  },
  groupDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  validatorBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  validatorPass: {
    backgroundColor: Colors.primaryLight,
  },
  validatorFail: {
    backgroundColor: "#FEE2E2",
  },
  validatorText: {
    ...Typography.bodyMedium,
    fontWeight: "700",
  },
  btnRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});
