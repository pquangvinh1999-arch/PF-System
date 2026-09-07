import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { useAppStore } from "../../../store/useAppStore";
import { Debt, DebtStrategy } from "../../../types";
import { DebtRow } from "../../../components/DebtRow";
import { DebtFormModal } from "../components/DebtFormModal";
import { DebtService } from "../../../services/debtService";
import { Card } from "../../../components";

export const DebtsScreen: React.FC = () => {
  const debts = useAppStore((s) => s.debts);
  const deleteDebt = useAppStore((s) => s.deleteDebt);
  const [strategy, setStrategy] = useState<DebtStrategy>("snowball");
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);

  const ordered = useMemo(() => DebtService.sortByStrategy(debts, strategy), [debts, strategy]);
  const plan = useMemo(() => DebtService.buildPayoffPlan(debts, strategy), [debts, strategy]);
  const totals = useMemo(() => DebtService.totals(debts), [debts]);
  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.summary}>
        <Text style={styles.summaryTitle}>💳 Tổng dư nợ ({totals.count} khoản)</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totals.totalBalance)}</Text>
        <Text style={styles.summarySub}>
          Trả tối thiểu {formatCurrency(totals.totalMinPayment)}/tháng
        </Text>
      </Card>

      <View style={styles.stratBar}>
        <TouchableOpacity
          style={[styles.stratBtn, strategy === "snowball" && styles.stratActive]}
          onPress={() => setStrategy("snowball")}
        >
          <Text style={[styles.stratText, strategy === "snowball" && styles.stratTextActive]}>
            ❄️ Snowball
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stratBtn, strategy === "avalanche" && styles.stratActiveBiz]}
          onPress={() => setStrategy("avalanche")}
        >
          <Text style={[styles.stratText, strategy === "avalanche" && styles.stratTextActive]}>
            🏔️ Avalanche
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.stratHint}>
        {strategy === "snowball"
          ? "Snowball: trả nợ nhỏ nhất trước để tạo động lực."
          : "Avalanche: trả nợ lãi cao nhất trước để tiết kiệm lãi."}
      </Text>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setEditing(null);
          setModalVisible(true);
        }}
      >
        <Text style={styles.addText}>+ Thêm khoản nợ</Text>
      </TouchableOpacity>

      {ordered.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>Không có khoản nợ nào</Text>
          <Text style={styles.emptyDesc}>Tuyệt vời! Hãy duy trì không nợ hoặc thêm khoản nợ để theo dõi.</Text>
        </Card>
      ) : (
        ordered.map((d, idx) => (
          <View key={d.id}>
            <DebtRow
              debt={d}
              priorityOrder={idx + 1}
              strategyLabel={strategy === "snowball" ? "Snowball" : "Avalanche"}
              onPress={(debt) => {
                setEditing(debt);
                setModalVisible(true);
              }}
            />
            <View style={styles.rowActions}>
              <Text style={styles.planText}>
                ⏳ ~{plan[idx]?.estimatedMonthsToClear ?? "?"} tháng (trả tối thiểu)
              </Text>
              <TouchableOpacity onPress={() => deleteDebt(d.id)}>
                <Text style={styles.deleteText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <DebtFormModal
        visible={modalVisible}
        debtToEdit={editing}
        onClose={() => {
          setModalVisible(false);
          setEditing(null);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  summary: { padding: Spacing.lg, marginBottom: Spacing.md, borderTopWidth: 3, borderTopColor: Colors.danger },
  summaryTitle: { ...Typography.bodyMedium, fontWeight: "700", color: Colors.textPrimary },
  summaryValue: { fontSize: 22, fontWeight: "800", color: Colors.danger, marginTop: 4 },
  summarySub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  stratBar: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
  stratBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  stratActive: { backgroundColor: Colors.primary },
  stratActiveBiz: { backgroundColor: Colors.businessTag },
  stratText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  stratTextActive: { color: "#FFFFFF", fontWeight: "700" },
  stratHint: { ...Typography.caption, color: Colors.textSecondary, fontStyle: "italic", marginBottom: Spacing.md },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: Spacing.md, alignItems: "center", marginBottom: Spacing.md },
  addText: { color: "#FFFFFF", fontWeight: "700" },
  empty: { padding: Spacing.xl, alignItems: "center" },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { ...Typography.bodyMedium, fontWeight: "700", color: Colors.textPrimary },
  emptyDesc: { ...Typography.caption, color: Colors.textSecondary, textAlign: "center", marginTop: 4 },
  rowActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: -2, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  planText: { fontSize: 11, color: Colors.textSecondary },
  deleteText: { fontSize: 11, color: Colors.danger, fontWeight: "600" },
});
