import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Button, Badge } from "../../../components";
import { BudgetAlertReport, GroupAlert } from "../../../services/budgetAlertService";
import { getCategoryIcon } from "../../../constants/categories";

interface Props {
  visible: boolean;
  report: BudgetAlertReport | null;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const BudgetAlertModal: React.FC<Props> = ({
  visible,
  report,
  onClose,
  onOpenConfig,
}) => {
  if (!report) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.abs(val)) + " đ";
  };

  const alertGroups = report.alerts.filter((a) => a.level !== "safe");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.headerIcon}>
                {report.highestAlertLevel === "danger" ? "🚨" : "⚠️"}
              </Text>
              <View>
                <Text style={styles.title}>Chi tiết Cảnh báo Ngân sách</Text>
                <Text style={styles.subTitle}>Kỳ kế toán: {report.period}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {alertGroups.length === 0 ? (
              <View style={styles.safeBox}>
                <Text style={styles.safeIcon}>✅</Text>
                <Text style={styles.safeTitle}>Mọi nhóm ngân sách đều trong tầm kiểm soát</Text>
                <Text style={styles.safeDesc}>
                  Chi tiêu của bạn trong tháng hiện tại chưa vượt quá 80% định mức của bất kỳ nhóm nào.
                </Text>
              </View>
            ) : (
              alertGroups.map((alert) => (
                <View
                  key={alert.group}
                  style={[
                    styles.alertCard,
                    alert.level === "danger" ? styles.alertCardDanger : styles.alertCardWarning,
                  ]}
                >
                  {/* Card Title */}
                  <View style={styles.alertCardHeader}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{alert.groupName}</Text>
                      <Text style={styles.spentRateText}>
                        Đã dùng {alert.spentRate}% định mức ({formatCurrency(alert.spentAmount)} / {formatCurrency(alert.allocatedAmount)})
                      </Text>
                    </View>
                    <Badge
                      label={
                        alert.level === "danger"
                          ? `Bội chi +${formatCurrency(alert.overAmount)}`
                          : `Còn lại ${formatCurrency(alert.remainingAmount)}`
                      }
                      type={alert.level === "danger" ? "danger" : "warning"}
                    />
                  </View>

                  {/* Progress track */}
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${Math.min(alert.spentRate, 100)}%`,
                          backgroundColor: alert.level === "danger" ? Colors.danger : Colors.warning,
                        },
                      ]}
                    />
                  </View>

                  {/* Recommendation Box */}
                  <View style={styles.adviceBox}>
                    <Text style={styles.adviceLabel}>💡 Đề xuất hành động:</Text>
                    <Text style={styles.adviceText}>{alert.recommendation}</Text>
                  </View>

                  {/* Top Spending Transactions */}
                  {alert.topTransactions.length > 0 && (
                    <View style={styles.topTxsContainer}>
                      <Text style={styles.topTxsTitle}>Top giao dịch lớn nhất trong nhóm:</Text>
                      {alert.topTransactions.map((tx) => (
                        <View key={tx.id} style={styles.txRow}>
                          <Text style={styles.txIcon}>{getCategoryIcon(tx.category)}</Text>
                          <View style={styles.txInfo}>
                            <Text style={styles.txCategory}>{tx.category}</Text>
                            <Text style={styles.txDate}>{tx.date}</Text>
                          </View>
                          <Text style={styles.txAmount}>-{formatCurrency(tx.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}

            <View style={styles.hintCard}>
              <Text style={styles.hintIcon}>🎯</Text>
              <Text style={styles.hintText}>
                Quy tắc 50/30/20 giúp cân bằng cuộc sống và tích lũy. Nếu nhu cầu thực tế thay đổi, bạn có thể điều chỉnh lại tỷ lệ % bất cứ lúc nào.
              </Text>
            </View>
          </ScrollView>

          {/* Actions Footer */}
          <View style={styles.footer}>
            <Button
              title="Đóng"
              variant="outline"
              onPress={onClose}
              style={styles.actionBtnSecondary}
            />
            <Button
              title="Chỉnh sửa ngân sách"
              variant="primary"
              onPress={() => {
                onClose();
                onOpenConfig();
              }}
              style={styles.actionBtnPrimary}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.bottomSheet,
    borderTopRightRadius: BorderRadius.bottomSheet,
    maxHeight: "85%",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 26,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  subTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 22,
    color: Colors.textSecondary,
    fontWeight: "700",
    padding: Spacing.xs,
  },
  body: {
    marginVertical: Spacing.xs,
  },
  safeBox: {
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.card,
    marginVertical: Spacing.md,
  },
  safeIcon: {
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
  safeTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  safeDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  alertCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  alertCardDanger: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  alertCardWarning: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  alertCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  groupInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  groupName: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  spentRateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  track: {
    height: 8,
    backgroundColor: "#ECEAE4",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: Spacing.sm,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  adviceBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.xs,
  },
  adviceLabel: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  adviceText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  topTxsContainer: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    paddingTop: Spacing.sm,
  },
  topTxsTitle: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: Spacing.sm,
  },
  txIcon: {
    fontSize: 16,
  },
  txInfo: {
    flex: 1,
  },
  txCategory: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  txDate: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  txAmount: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.danger,
  },
  hintCard: {
    flexDirection: "row",
    backgroundColor: "#F4EFEB",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  hintIcon: {
    fontSize: 22,
  },
  hintText: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtnSecondary: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 2,
  },
});
