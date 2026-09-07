import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card, Button, Badge } from "../../../components";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { RootStackParamList } from "../../../navigation/types";
import { useAppStore } from "../../../store/useAppStore";
import { IncomeSourceType, FrequencyType } from "../../../types";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

interface IncomeFormItem {
  id: string;
  name: string;
  type: IncomeSourceType;
  amount: string;
  frequency: FrequencyType;
}

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [step, setStep] = useState<number>(1);
  const [userName, setUserName] = useState<string>("");
  const [personalBalance, setPersonalBalance] = useState<string>("10000000");
  const [businessBalance, setBusinessBalance] = useState<string>("20000000");

  const [incomeSources, setIncomeSources] = useState<IncomeFormItem[]>([
    {
      id: "1",
      name: "Lương văn phòng (Chồng)",
      type: "fixed_salary",
      amount: "25000000",
      frequency: "monthly",
    },
    {
      id: "2",
      name: "Lương văn phòng (Vợ)",
      type: "fixed_salary",
      amount: "20000000",
      frequency: "monthly",
    },
    {
      id: "3",
      name: "Doanh thu Shop Online",
      type: "business_revenue",
      amount: "35000000",
      frequency: "monthly",
    },
  ]);

  const addIncomeSource = () => {
    const newItem: IncomeFormItem = {
      id: Date.now().toString(),
      name: "Nguồn thu mới",
      type: "other",
      amount: "5000000",
      frequency: "monthly",
    };
    setIncomeSources([...incomeSources, newItem]);
  };

  const removeIncomeSource = (id: string) => {
    if (incomeSources.length <= 1) {
      Alert.alert("Thông báo", "Cần tối thiểu 1 nguồn thu nhập.");
      return;
    }
    setIncomeSources(incomeSources.filter((item) => item.id !== id));
  };

  const updateIncomeSource = (id: string, field: keyof IncomeFormItem, value: any) => {
    setIncomeSources(
      incomeSources.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleFinish = async () => {
    if (!userName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên của bạn hoặc gia đình.");
      return;
    }

    try {
      const parsedSources = incomeSources.map((s) => ({
        name: s.name.trim() || "Khoản thu",
        type: s.type,
        amount: parseFloat(s.amount) || 0,
        frequency: s.frequency,
      }));

      await completeOnboarding(
        userName.trim(),
        parsedSources,
        parseFloat(personalBalance) || 0,
        parseFloat(businessBalance) || 0
      );

      navigation.replace("MainTabs", { screen: "Dashboard" });
    } catch (err) {
      Alert.alert("Lỗi", "Không thể hoàn thành khởi tạo. Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>Vén</Text>
          <Text style={styles.tagline}>Vén khéo dòng tiền của bạn</Text>
          <Badge
            label={`Bước ${step}/3: ${
              step === 1
                ? "Thông tin tài khoản"
                : step === 2
                ? "Thiết lập nguồn thu nhập"
                : "Số dư ví ban đầu"
            }`}
            type="primary"
          />
        </View>

        {step === 1 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Chào mừng bạn đến với Vén</Text>
            <Text style={styles.cardSubtitle}>
              Ứng dụng quản lý tài chính chuẩn chuyên gia, giúp bạn tách bạch dòng tiền gia đình và kinh doanh nhỏ lẻ.
            </Text>

            <Text style={styles.label}>Tên bạn hoặc tên Hộ gia đình</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Gia đình Bình An"
              value={userName}
              onChangeText={setUserName}
            />

            <Button
              title="Tiếp tục: Cấu hình nguồn thu"
              variant="primary"
              onPress={() => {
                if (!userName.trim()) {
                  Alert.alert("Thông báo", "Vui lòng nhập tên để tiếp tục.");
                  return;
                }
                setStep(2);
              }}
            />
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Nguồn thu nhập gia đình</Text>
            <Text style={styles.cardSubtitle}>
              Nhập các nguồn lương cố định và doanh thu kinh doanh để app tự động phân bổ theo phương pháp 50/30/20 & Profit First.
            </Text>

            {incomeSources.map((item, index) => (
              <View key={item.id} style={styles.incomeItem}>
                <View style={styles.incomeHeader}>
                  <Text style={styles.incomeIndex}>Nguồn #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeIncomeSource(item.id)}>
                    <Text style={styles.removeText}>Xóa</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Tên nguồn thu (VD: Lương, Shop...)"
                  value={item.name}
                  onChangeText={(val) => updateIncomeSource(item.id, "name", val)}
                />

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Số tiền dự kiến (VNĐ)"
                    keyboardType="numeric"
                    value={item.amount}
                    onChangeText={(val) => updateIncomeSource(item.id, "amount", val)}
                  />
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        item.type === "fixed_salary" && styles.typeBtnActive,
                      ]}
                      onPress={() => updateIncomeSource(item.id, "type", "fixed_salary")}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          item.type === "fixed_salary" && styles.typeTextActive,
                        ]}
                      >
                        Lương
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        item.type === "business_revenue" && styles.typeBtnActive,
                      ]}
                      onPress={() => updateIncomeSource(item.id, "type", "business_revenue")}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          item.type === "business_revenue" && styles.typeTextActive,
                        ]}
                      >
                        Shop
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        item.type === "other" && styles.typeBtnActive,
                      ]}
                      onPress={() => updateIncomeSource(item.id, "type", "other")}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          item.type === "other" && styles.typeTextActive,
                        ]}
                      >
                        Khác
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <Button
              title="+ Thêm nguồn thu nhập khác"
              variant="outline"
              style={styles.addBtn}
              onPress={addIncomeSource}
            />

            <View style={styles.btnRow}>
              <Button
                title="Quay lại"
                variant="outline"
                style={styles.backBtn}
                onPress={() => setStep(1)}
              />
              <Button
                title="Tiếp tục"
                variant="primary"
                style={styles.nextBtn}
                onPress={() => {
                  for (let i = 0; i < incomeSources.length; i++) {
                    const s = incomeSources[i];
                    if (!s.name.trim()) {
                      Alert.alert("Thông báo", `Vui lòng nhập tên cho nguồn thu #${i + 1}`);
                      return;
                    }
                    const amt = parseFloat(s.amount);
                    if (isNaN(amt) || amt < 0) {
                      Alert.alert("Thông báo", `Số tiền cho nguồn thu #${i + 1} không hợp lệ`);
                      return;
                    }
                  }
                  setStep(3);
                }}
              />
            </View>
          </Card>
        )}

        {step === 3 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Khởi tạo số dư 2 Ví</Text>
            <Text style={styles.cardSubtitle}>
              Tách bạch hoàn toàn Ví Cá nhân và Ví Kinh doanh theo nguyên tắc cốt lõi của Vén.
            </Text>

            <View style={styles.accountBox}>
              <Badge label="Cá nhân" type="primary" style={styles.accountBadge} />
              <Text style={styles.label}>Số dư hiện tại Ví Cá nhân (VNĐ)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={personalBalance}
                onChangeText={setPersonalBalance}
              />
            </View>

            <View style={[styles.accountBox, styles.businessBox]}>
              <Badge label="Kinh doanh (Shop)" type="business" style={styles.accountBadge} />
              <Text style={styles.label}>Số dư hiện tại Ví Kinh doanh (VNĐ)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={businessBalance}
                onChangeText={setBusinessBalance}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Quay lại"
                variant="outline"
                style={styles.backBtn}
                onPress={() => setStep(2)}
              />
              <Button
                title="Hoàn tất & Vào App"
                variant="primary"
                style={styles.nextBtn}
                onPress={handleFinish}
              />
            </View>
          </Card>
        )}
      </ScrollView>
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
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  logo: {
    ...Typography.h1,
    fontSize: 38,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.xl,
  },
  cardTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  label: {
    ...Typography.bodyMedium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: "#F9F9F8",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  incomeItem: {
    backgroundColor: "#FAF9F6",
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  incomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  incomeIndex: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primary,
  },
  removeText: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
    marginBottom: 0,
  },
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  typeBtn: {
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  typeBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  addBtn: {
    marginBottom: Spacing.xl,
  },
  btnRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  backBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
  accountBox: {
    backgroundColor: "#F4F8F6",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#E0EFE8",
  },
  businessBox: {
    backgroundColor: "#F2F4FD",
    borderColor: "#E0E5FA",
  },
  accountBadge: {
    marginBottom: Spacing.sm,
  },
});
