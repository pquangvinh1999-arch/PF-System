import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Account } from "../types";
import { Colors, Spacing, Typography, BorderRadius, Shadows } from "../constants/theme";
import { Badge } from "./Badge";

interface BalanceCardProps {
  account: Account;
  onPress?: () => void;
  onActionPress?: () => void;
  actionTitle?: string;
  style?: StyleProp<ViewStyle>;
  showDetails?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  account,
  onPress,
  onActionPress,
  actionTitle,
  style,
  showDetails = false,
}) => {
  const isBusiness = account.type === "business";

  const themeColor = isBusiness ? Colors.businessTag : Colors.primary;
  const themeBg = isBusiness ? "#F4F6FE" : "#F2F8F5";
  const iconEmoji = isBusiness ? "🏪" : "👛";
  const typeLabel = isBusiness ? "Kinh doanh (Shop)" : "Cá nhân & Gia đình";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: isBusiness ? "#D9E0FD" : "#D4E8E0",
          borderTopColor: themeColor,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: themeBg }]}>
            <Text style={styles.iconText}>{iconEmoji}</Text>
          </View>
          <View>
            <Text style={styles.accountName}>{account.name}</Text>
            <Badge
              label={typeLabel}
              type={isBusiness ? "business" : "primary"}
              style={styles.badge}
            />
          </View>
        </View>

        {account.is_default && (
          <View style={styles.defaultTag}>
            <Text style={styles.defaultText}>Mặc định</Text>
          </View>
        )}
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
        <Text style={[styles.balanceValue, { color: themeColor }]}>
          {formatCurrency(account.balance)}
        </Text>
      </View>

      {showDetails && (
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Số dư ban đầu</Text>
            <Text style={styles.detailValue}>{formatCurrency(account.initial_balance)}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Loại dòng tiền</Text>
            <Text
              style={[
                styles.detailValue,
                { color: isBusiness ? Colors.businessTag : Colors.primary },
              ]}
            >
              {isBusiness ? "Độc lập (Shop)" : "Chi tiêu chung"}
            </Text>
          </View>
        </View>
      )}

      {onActionPress && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: themeColor }]}
          onPress={onActionPress}
        >
          <Text style={[styles.actionText, { color: themeColor }]}>
            {actionTitle || (isBusiness ? "⇄ Rút lợi nhuận / Chuyển khoản" : "⇄ Chuyển sang ví khác")}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderTopWidth: 4,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 22,
  },
  accountName: {
    ...Typography.bodyLarge,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  badge: {
    alignSelf: "flex-start",
  },
  defaultTag: {
    backgroundColor: "#F3F3F1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  balanceSection: {
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  balanceValue: {
    ...Typography.h1,
    fontSize: 24,
    fontWeight: "800",
  },
  detailsRow: {
    flexDirection: "row",
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.button,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  detailDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  actionBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    ...Typography.caption,
    fontWeight: "700",
  },
});
