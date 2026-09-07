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
import { Transaction, TransactionType } from "../../../types";
import { useAppStore } from "../../../store/useAppStore";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Button } from "../../../components";

interface Props {
  visible: boolean;
  transactionToEdit?: Transaction | null;
  onClose: () => void;
  onSuccess?: () => void;
}

import {
  CategoryItem,
  getCategoriesByType,
  getCategoryIcon,
} from "../../../constants/categories";
import { ProfitFirstBreakdown } from "../../profitFirst/components/ProfitFirstBreakdown";
import { ProfitFirstService } from "../../../services/profitFirstService";

export const TransactionFormModal: React.FC<Props> = ({
  visible,
  transactionToEdit,
  onClose,
  onSuccess,
}) => {
  const accounts = useAppStore((state) => state.accounts);
  const incomeSources = useAppStore((state) => state.incomeSources);
  const profitFirstRules = useAppStore((state) => state.profitFirstRules);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const updateTransaction = useAppStore((state) => state.updateTransaction);
  const deleteTransaction = useAppStore((state) => state.deleteTransaction);

  const isEditing = Boolean(transactionToEdit);

  const [type, setType] = useState<TransactionType>("expense");
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [category, setCategory] = useState<string>("Ăn uống");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [incomeSourceId, setIncomeSourceId] = useState<string>("");

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isBusinessRevenue =
    type === "income" &&
    (selectedAccount?.type === "business" || category === "Doanh thu kinh doanh");

  useEffect(() => {
    if (visible) {
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        setAccountId(transactionToEdit.account_id);
        setToAccountId(transactionToEdit.to_account_id || "");
        setCategory(transactionToEdit.category);
        setAmount(transactionToEdit.amount.toString());
        setDate(transactionToEdit.date);
        setNote(transactionToEdit.note || "");
        setIncomeSourceId(transactionToEdit.income_source_id || "");
      } else {
        // Defaults
        setType("expense");
        setAccountId(accounts.length > 0 ? accounts[0].id : "");
        setToAccountId(accounts.length > 1 ? accounts[1].id : "");
        setCategory("Ăn uống");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setNote("");
        setIncomeSourceId("");
      }
    }
  }, [visible, transactionToEdit, accounts]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === "expense") {
      setCategory("Ăn uống");
    } else if (newType === "income") {
      setCategory("Lương");
    } else {
      setCategory("Chuyển khoản");
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }

    if (!accountId) {
      Alert.alert("Lỗi", "Vui lòng chọn tài khoản ví.");
      return;
    }

    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) {
      Alert.alert("Lỗi", "Vui lòng chọn tài khoản nhận khác tài khoản chuyển.");
      return;
    }

    const txDate = date.trim() || new Date().toISOString().split("T")[0];

    let finalNote = note.trim();
    if (isBusinessRevenue && profitFirstRules.length > 0) {
      const allocation = ProfitFirstService.calculateAllocation(numAmount, profitFirstRules);
      const breakdownSummary = allocation.allocations
        .map((a) => `${a.title}: ${new Intl.NumberFormat("vi-VN").format(a.amount)}đ (${a.percentage}%)`)
        .join(" | ");

      if (!finalNote.includes("[Profit First]")) {
        finalNote = finalNote
          ? `${finalNote}\n[Profit First]: ${breakdownSummary}`
          : `[Profit First]: ${breakdownSummary}`;
      }
    }

    try {
      if (isEditing && transactionToEdit) {
        await updateTransaction(transactionToEdit.id, {
          account_id: accountId,
          type,
          category,
          amount: numAmount,
          date: txDate,
          income_source_id: type === "income" ? incomeSourceId || undefined : undefined,
          to_account_id: type === "transfer" ? toAccountId || undefined : undefined,
          note: finalNote,
        });
      } else {
        await addTransaction({
          account_id: accountId,
          type,
          category,
          amount: numAmount,
          date: txDate,
          income_source_id: type === "income" ? incomeSourceId || undefined : undefined,
          to_account_id: type === "transfer" ? toAccountId || undefined : undefined,
          note: finalNote,
        });
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      Alert.alert("Lỗi", "Không thể lưu giao dịch. Vui lòng thử lại.");
    }
  };

  const handleDelete = () => {
    if (!transactionToEdit) return;

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa giao dịch này? Số dư ví sẽ được hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionToEdit.id);
              onSuccess && onSuccess();
              onClose();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa giao dịch.");
            }
          },
        },
      ]
    );
  };

  const availableCategories = getCategoriesByType(type, selectedAccount?.type);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEditing ? "Chỉnh sửa Giao dịch" : "Giao dịch Mới"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Loại giao dịch: Chi tiêu / Thu nhập / Chuyển khoản */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === "expense" && styles.typeBtnExpenseActive]}
                onPress={() => handleTypeChange("expense")}
              >
                <Text
                  style={[styles.typeBtnText, type === "expense" && styles.typeBtnTextActive]}
                >
                  Chi tiêu
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, type === "income" && styles.typeBtnIncomeActive]}
                onPress={() => handleTypeChange("income")}
              >
                <Text
                  style={[styles.typeBtnText, type === "income" && styles.typeBtnTextActive]}
                >
                  Thu nhập
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, type === "transfer" && styles.typeBtnTransferActive]}
                onPress={() => handleTypeChange("transfer")}
              >
                <Text
                  style={[styles.typeBtnText, type === "transfer" && styles.typeBtnTextActive]}
                >
                  Chuyển khoản
                </Text>
              </TouchableOpacity>
            </View>

            {/* Số tiền */}
            <Text style={styles.label}>Số tiền (VNĐ) *</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Tài khoản nguồn */}
            <Text style={styles.label}>
              {type === "transfer" ? "Từ Ví *" : "Ví / Tài khoản *"}
            </Text>
            <View style={styles.chipsRow}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.chip,
                    accountId === acc.id && styles.chipActive,
                    acc.type === "business" && styles.chipBusiness,
                    accountId === acc.id &&
                      acc.type === "business" &&
                      styles.chipBusinessActive,
                  ]}
                  onPress={() => setAccountId(acc.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      accountId === acc.id && styles.chipTextActive,
                    ]}
                  >
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tài khoản đích nếu là chuyển khoản */}
            {type === "transfer" && (
              <>
                <Text style={styles.label}>Đến Ví *</Text>
                <View style={styles.chipsRow}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.chip,
                        toAccountId === acc.id && styles.chipActive,
                        acc.type === "business" && styles.chipBusiness,
                        toAccountId === acc.id &&
                          acc.type === "business" &&
                          styles.chipBusinessActive,
                      ]}
                      onPress={() => setToAccountId(acc.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          toAccountId === acc.id && styles.chipTextActive,
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Danh mục Category */}
            <Text style={styles.label}>Danh mục *</Text>
            <View style={styles.chipsRow}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, category === cat.name && styles.chipActive]}
                  onPress={() => setCategory(cat.name)}
                >
                  <Text
                    style={[styles.chipText, category === cat.name && styles.chipTextActive]}
                  >
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Phân bổ tự động Profit First nếu là Doanh thu kinh doanh */}
            {isBusinessRevenue && parseFloat(amount) > 0 && profitFirstRules.length > 0 && (
              <ProfitFirstBreakdown
                revenueAmount={parseFloat(amount)}
                rules={profitFirstRules}
                title="Tự Động Phân Bổ Doanh Thu (Profit First)"
              />
            )}

            {/* Nguồn thu nhập (nếu type = income) */}
            {type === "income" && incomeSources.length > 0 && (
              <>
                <Text style={styles.label}>Gắn với nguồn thu nhập (tùy chọn)</Text>
                <View style={styles.chipsRow}>
                  {incomeSources.map((src) => (
                    <TouchableOpacity
                      key={src.id}
                      style={[
                        styles.chip,
                        incomeSourceId === src.id && styles.chipActive,
                      ]}
                      onPress={() =>
                        setIncomeSourceId(incomeSourceId === src.id ? "" : src.id)
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          incomeSourceId === src.id && styles.chipTextActive,
                        ]}
                      >
                        {src.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Ngày giao dịch */}
            <Text style={styles.label}>Ngày (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-09-07"
              value={date}
              onChangeText={setDate}
            />

            {/* Ghi chú */}
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Cơm trưa đồng nghiệp..."
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.actionRow}>
              {isEditing && (
                <Button
                  title="Xóa"
                  variant="outline"
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                />
              )}
              <Button
                title={isEditing ? "Cập nhật" : "Lưu giao dịch"}
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
    color: Colors.textPrimary,
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
  typeSelector: {
    flexDirection: "row",
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.button,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.button,
  },
  typeBtnExpenseActive: {
    backgroundColor: Colors.danger,
  },
  typeBtnIncomeActive: {
    backgroundColor: Colors.success,
  },
  typeBtnTransferActive: {
    backgroundColor: Colors.businessTag,
  },
  typeBtnText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  typeBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  label: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  amountInput: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipBusiness: {
    borderColor: Colors.businessTag,
  },
  chipBusinessActive: {
    backgroundColor: Colors.businessTag,
    borderColor: Colors.businessTag,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  deleteBtn: {
    flex: 1,
    borderColor: Colors.danger,
  },
  saveBtn: {
    flex: 2,
  },
});
