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
import { Debt } from "../../../types";
import { DebtService } from "../../../services/debtService";
import { useAppStore } from "../../../store/useAppStore";

interface DebtFormModalProps {
  visible: boolean;
  debtToEdit?: Debt | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({ visible, debtToEdit, onClose, onSuccess }) => {
  const addDebt = useAppStore((s) => s.addDebt);
  const updateDebt = useAppStore((s) => s.updateDebt);

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [minPay, setMinPay] = useState("");
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("snowball");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setError("");
      setSaving(false);
      if (debtToEdit) {
        setName(debtToEdit.name);
        setBalance(String(debtToEdit.balance));
        setRate(String(debtToEdit.interest_rate));
        setMinPay(String(debtToEdit.min_payment));
        setStrategy(debtToEdit.strategy);
      } else {
        setName("");
        setBalance("");
        setRate("");
        setMinPay("");
        setStrategy("snowball");
      }
    }
  }, [visible, debtToEdit]);

  const handleSave = async () => {
    const result = DebtService.validateDebtInput({
      name,
      balance,
      interestRate: rate,
      minPayment: minPay,
      strategy,
    });
    if (!result.isValid || !result.data) {
      setError(result.error || "Dữ liệu không hợp lệ");
      return;
    }
    setSaving(true);
    try {
      if (debtToEdit) {
        await updateDebt(debtToEdit.id, result.data);
      } else {
        await addDebt(result.data);
      }
      onSuccess?.();
      onClose();
    } catch {
      setError("Không thể lưu khoản nợ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>{debtToEdit ? "Sửa khoản nợ" : "Thêm khoản nợ mới"}</Text>
            <Text style={styles.subtitle}>Nhập dư nợ, lãi suất và khoản trả tối thiểu hàng tháng</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Tên khoản nợ *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ví dụ: Thẻ tín dụng VCB, Vay mua xe..." placeholderTextColor={Colors.textSecondary} maxLength={80} />
              <Text style={styles.label}>Dư nợ hiện tại (đ) *</Text>
              <TextInput style={styles.input} value={balance} onChangeText={setBalance} keyboardType="numeric" placeholder="Ví dụ: 20000000" placeholderTextColor={Colors.textSecondary} />
              <Text style={styles.label}>Lãi suất (%/năm)</Text>
              <TextInput style={styles.input} value={rate} onChangeText={setRate} keyboardType="numeric" placeholder="Ví dụ: 18" placeholderTextColor={Colors.textSecondary} />
              <Text style={styles.label}>Trả tối thiểu / tháng (đ) *</Text>
              <TextInput style={styles.input} value={minPay} onChangeText={setMinPay} keyboardType="numeric" placeholder="Ví dụ: 2000000" placeholderTextColor={Colors.textSecondary} />
              <Text style={styles.label}>Chiến lược ưu tiên</Text>
              <View style={styles.stratRow}>
                <TouchableOpacity style={[styles.stratChip, strategy === "snowball" && styles.stratActive]} onPress={() => setStrategy("snowball")}>
                  <Text style={[styles.stratText, strategy === "snowball" && styles.stratTextActive]}>❄️ Snowball (nợ nhỏ trước)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stratChip, strategy === "avalanche" && styles.stratActive]} onPress={() => setStrategy("avalanche")}>
                  <Text style={[styles.stratText, strategy === "avalanche" && styles.stratTextActive]}>🏔️ Avalanche (lãi cao trước)</Text>
                </TouchableOpacity>
              </View>
              {Boolean(error) && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  wrap: { justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.bottomSheet, borderTopRightRadius: BorderRadius.bottomSheet, padding: Spacing.lg, maxHeight: "88%" },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: Colors.border, alignSelf: "center", marginBottom: Spacing.md },
  title: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.sm },
  label: { ...Typography.caption, fontWeight: "700", color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.button, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.bg },
  stratRow: { gap: Spacing.sm },
  stratChip: { padding: Spacing.sm, borderRadius: BorderRadius.button, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg, marginBottom: Spacing.sm },
  stratActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stratText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  stratTextActive: { color: "#FFFFFF", fontWeight: "700" },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: BorderRadius.sm, padding: Spacing.sm, marginTop: Spacing.md },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: "600" },
  actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.button, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  cancelText: { fontWeight: "700", color: Colors.textSecondary },
  saveBtn: { flex: 2, paddingVertical: Spacing.md, borderRadius: BorderRadius.button, backgroundColor: Colors.primary, alignItems: "center" },
  disabled: { opacity: 0.6 },
  saveText: { fontWeight: "700", color: "#FFFFFF" },
});
