import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { BalanceCard, Card, Badge, Button, TransactionRow } from "../../../components";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { useAppStore } from "../../../store/useAppStore";
import { Account, Transaction } from "../../../types";
import { TransactionFormModal } from "../../transactions/components/TransactionFormModal";
import { ProfitFirstRuleCard } from "../../profitFirst/components/ProfitFirstRuleCard";
import { ProfitFirstRuleConfigModal } from "../../profitFirst/components/ProfitFirstRuleConfigModal";

export const AccountsScreen: React.FC = () => {
  const accounts = useAppStore((state) => state.accounts);
  const transactions = useAppStore((state) => state.transactions);
  const profitFirstRules = useAppStore((state) => state.profitFirstRules);
  const fetchProfitFirstRules = useAppStore((state) => state.fetchProfitFirstRules);
  const saveProfitFirstRules = useAppStore((state) => state.saveProfitFirstRules);
  const resetProfitFirstRules = useAppStore((state) => state.resetProfitFirstRules);

  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [profitFirstModalVisible, setProfitFirstModalVisible] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const personalAccount = accounts.find((a) => a.type === "personal");
  const businessAccount = accounts.find((a) => a.type === "business");

  useEffect(() => {
    if (businessAccount && profitFirstRules.length === 0) {
      fetchProfitFirstRules(businessAccount.id);
    }
  }, [businessAccount?.id]);

  // Giao dịch được lọc theo tài khoản
  const filteredTransactions = transactions.filter((tx) => {
    if (selectedAccountId === "all") return true;
    return tx.account_id === selectedAccountId || tx.to_account_id === selectedAccountId;
  });

  const getAccountName = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : undefined;
  };

  const handleOpenTransfer = () => {
    setEditingTx(null);
    setModalVisible(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Quản lý Ví & Tài khoản</Text>
            <Text style={styles.subtitle}>
              Tách bạch 100% dòng tiền Cá nhân và Kinh doanh
            </Text>
          </View>
          <Button
            title="⇄ Chuyển ví"
            variant="outline"
            style={styles.transferBtn}
            onPress={handleOpenTransfer}
          />
        </View>

        {/* Tab chuyển đổi xem: Tất cả / Cá nhân / Kinh doanh */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentItem,
              selectedAccountId === "all" && styles.segmentItemActive,
            ]}
            onPress={() => setSelectedAccountId("all")}
          >
            <Text
              style={[
                styles.segmentText,
                selectedAccountId === "all" && styles.segmentTextActive,
              ]}
            >
              Tất cả ví ({accounts.length})
            </Text>
          </TouchableOpacity>

          {personalAccount && (
            <TouchableOpacity
              style={[
                styles.segmentItem,
                selectedAccountId === personalAccount.id && styles.segmentItemActive,
              ]}
              onPress={() => setSelectedAccountId(personalAccount.id)}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedAccountId === personalAccount.id && styles.segmentTextActive,
                ]}
              >
                Ví Cá nhân
              </Text>
            </TouchableOpacity>
          )}

          {businessAccount && (
            <TouchableOpacity
              style={[
                styles.segmentItem,
                selectedAccountId === businessAccount.id && styles.segmentItemBizActive,
              ]}
              onPress={() => setSelectedAccountId(businessAccount.id)}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedAccountId === businessAccount.id && styles.segmentTextActive,
                ]}
              >
                Ví Kinh doanh
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Danh sách thẻ BalanceCard */}
        {(selectedAccountId === "all" || selectedAccountId === personalAccount?.id) &&
          personalAccount && (
            <BalanceCard
              account={personalAccount}
              showDetails
              onActionPress={handleOpenTransfer}
              actionTitle="⇄ Chuyển sang Ví Kinh doanh"
            />
          )}

        {(selectedAccountId === "all" || selectedAccountId === businessAccount?.id) &&
          businessAccount && (
            <>
              <BalanceCard
                account={businessAccount}
                showDetails
                onActionPress={handleOpenTransfer}
                actionTitle="⇄ Rút lợi nhuận sang Ví Cá nhân"
              />
              <ProfitFirstRuleCard
                rules={profitFirstRules}
                onPressConfigure={() => setProfitFirstModalVisible(true)}
              />
            </>
          )}

        {/* Lịch sử giao dịch sổ cái của ví được chọn */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedAccountId === "all"
              ? "Toàn bộ dòng tiền"
              : selectedAccountId === personalAccount?.id
              ? "Sổ cái Ví Cá nhân"
              : "Sổ cái Ví Kinh doanh"}
          </Text>
          <Badge
            label={`${filteredTransactions.length} giao dịch`}
            type={
              selectedAccountId === businessAccount?.id
                ? "business"
                : "primary"
            }
          />
        </View>

        {filteredTransactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Chưa có giao dịch cho ví này</Text>
            <Text style={styles.emptyDesc}>
              Bấm "+ Thêm thu chi" hoặc "⇄ Chuyển ví" để ghi nhận giao dịch.
            </Text>
          </Card>
        ) : (
          filteredTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              accountName={getAccountName(tx.account_id)}
              onPress={handleOpenEditTx}
            />
          ))
        )}
      </ScrollView>

      {/* Modal Transaction */}
      <TransactionFormModal
        visible={modalVisible}
        transactionToEdit={editingTx}
        onClose={() => {
          setModalVisible(false);
          setEditingTx(null);
        }}
      />

      {/* Modal Cấu hình Profit First */}
      {businessAccount && (
        <ProfitFirstRuleConfigModal
          visible={profitFirstModalVisible}
          accountId={businessAccount.id}
          initialRules={profitFirstRules}
          onClose={() => setProfitFirstModalVisible(false)}
          onSave={async (rules) => {
            await saveProfitFirstRules(businessAccount.id, rules);
          }}
          onReset={async () => {
            await resetProfitFirstRules(businessAccount.id);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transferBtn: {
    height: 40,
    paddingHorizontal: Spacing.md,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    padding: 4,
    borderRadius: BorderRadius.button,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.button - 2,
  },
  segmentItemActive: {
    backgroundColor: Colors.primary,
  },
  segmentItemBizActive: {
    backgroundColor: Colors.businessTag,
  },
  segmentText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
