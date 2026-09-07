import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Share, Alert } from "react-native";
import { Card, Badge } from "../../../components";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { useAppStore } from "../../../store/useAppStore";
import { BiometricService } from "../../../services/biometricService";
import { BackupService } from "../../../services/backupService";
import { SyncService } from "../../../services/syncService";

export const ProfileScreen: React.FC = () => {
  const lockEnabled = useAppStore((s) => s.lockEnabled);
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const setupPin = useAppStore((s) => s.setupPin);
  const disableLock = useAppStore((s) => s.disableLock);
  const setBiometricEnabled = useAppStore((s) => s.setBiometricEnabled);
  const lock = useAppStore((s) => s.lock);

  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [bioStatus, setBioStatus] = useState("");
  const [backupKey, setBackupKey] = useState("");
  const [backupOut, setBackupOut] = useState("");
  const [restoreIn, setRestoreIn] = useState("");
  const [backupMsg, setBackupMsg] = useState("");

  const handleSetupPin = async () => {
    const r = await setupPin(pin);
    setPinMsg(r.ok ? "✅ Đã bật khóa PIN. Thoát app mở lại để kiểm tra." : `⚠️ ${r.error}`);
    if (r.ok) setPin("");
  };

  const handleToggleBio = async () => {
    if (!biometricEnabled) {
      const st = await BiometricService.getStatus();
      if (st.status !== "available") {
        setBioStatus(`⚠️ Thiết bị: ${st.status} — hãy dùng PIN (cần máy thật có vân tay/Face ID).`);
        return;
      }
      const ok = await BiometricService.authenticate();
      if (!ok) {
        setBioStatus("⚠️ Xác thực thất bại — chưa bật sinh trắc học.");
        return;
      }
    }
    await setBiometricEnabled(!biometricEnabled);
    setBioStatus(biometricEnabled ? "Đã tắt sinh trắc học." : "✅ Đã bật sinh trắc học.");
  };

  const collectState = () => {
    const s = useAppStore.getState();
    return BackupService.serialize({
      user: s.user,
      incomeSources: s.incomeSources,
      accounts: s.accounts,
      transactions: s.transactions,
      budgets: s.budgets,
      profitFirstRules: s.profitFirstRules,
      plannedExpenses: s.plannedExpenses,
      goals: s.goals,
      debts: s.debts,
    });
  };

  const handleExportBackup = async () => {
    setBackupMsg("");
    try {
      const payload = collectState();
      const blob = BackupService.encrypt(payload, backupKey);
      setBackupOut(blob);
      await Share.share({ message: blob, title: "Backup Vén (mã hóa)" });
      setBackupMsg("✅ Đã tạo backup mã hóa — hãy lưu chuỗi này ở nơi an toàn.");
    } catch (e: any) {
      setBackupMsg(`⚠️ ${e?.message || "Không tạo được backup"}`);
    }
  };

  const handleValidateRestore = () => {
    setBackupMsg("");
    try {
      const obj = BackupService.decrypt(restoreIn, backupKey);
      const tables = Object.keys(obj.data).join(", ");
      Alert.alert(
        "Xác nhận khôi phục",
        `Backup hợp lệ (xuất ${obj.exportedAt}). Sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại bằng: ${tables}. Tiếp tục?`,
        [
          { text: "Hủy", style: "cancel" },
          { text: "Khôi phục", style: "destructive", onPress: () => handleDoRestore() },
        ]
      );
    } catch (e: any) {
      setBackupMsg(`⚠️ ${e?.message || "Backup không hợp lệ"}`);
    }
  };

  const handleDoRestore = async () => {
    try {
      const obj = BackupService.decrypt(restoreIn, backupKey);
      await useAppStore.getState().restoreBackup(obj.data as any);
      setBackupMsg("✅ Khôi phục xong — dữ liệu đã được nạp lại.");
      setRestoreIn("");
    } catch (e: any) {
      setBackupMsg(`⚠️ ${e?.message || "Khôi phục thất bại"}`);
    }
  };

  const handleSyncInfo = async () => {
    const r = await SyncService.local.push(collectState());
    setBackupMsg(`ℹ️ Đồng bộ cloud: ${r.message}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Badge label={lockEnabled ? "Đang khóa app" : "Chưa khóa"} type={lockEnabled ? "success" : "warning"} style={styles.badge} />
          <Text style={styles.title}>🔒 Bảo mật & Khóa app</Text>
          <Text style={styles.desc}>PIN 4–6 số + Face ID / Vân tay (cần máy thật để test sinh trắc học).</Text>
          <Text style={styles.label}>Đặt / đổi mã PIN</Text>
          <TextInput style={styles.input} value={pin} onChangeText={setPin} keyboardType="numeric" secureTextEntry maxLength={6} placeholder="Nhập PIN 4–6 số" placeholderTextColor={Colors.textSecondary} />
          {Boolean(pinMsg) && <Text style={styles.msg}>{pinMsg}</Text>}
          <View style={styles.row}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSetupPin}>
              <Text style={styles.primaryText}>Bật khóa PIN</Text>
            </TouchableOpacity>
            {lockEnabled && (
              <TouchableOpacity style={styles.ghostBtn} onPress={async () => { await disableLock(); setPinMsg("Đã tắt khóa app."); }}>
                <Text style={styles.ghostText}>Tắt khóa</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.bioBtn} onPress={handleToggleBio} disabled={!lockEnabled}>
            <Text style={[styles.bioText, !lockEnabled && styles.disabledText]}>
              {biometricEnabled ? "👆 Tắt Face ID / Vân tay" : "👆 Bật Face ID / Vân tay"}
            </Text>
          </TouchableOpacity>
          {!lockEnabled && <Text style={styles.hint}>Bật PIN trước, sau đó mới bật sinh trắc học.</Text>}
          {Boolean(bioStatus) && <Text style={styles.msg}>{bioStatus}</Text>}
          {lockEnabled && (
            <TouchableOpacity style={styles.ghostBtn} onPress={lock}>
              <Text style={styles.ghostText}>🔒 Khóa ngay</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card style={styles.card}>
          <Badge label="Backup mã hóa" type="primary" style={styles.badge} />
          <Text style={styles.title}>💾 Backup / Restore</Text>
          <Text style={styles.desc}>File backup được mã hóa bằng passphrase (nên dùng PIN) — không lưu plaintext.</Text>
          <Text style={styles.label}>Passphrase (≥ 4 ký tự)</Text>
          <TextInput style={styles.input} value={backupKey} onChangeText={setBackupKey} secureTextEntry placeholder="Nhập passphrase" placeholderTextColor={Colors.textSecondary} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleExportBackup}>
              <Text style={styles.primaryText}>📤 Tạo & chia sẻ backup</Text>
            </TouchableOpacity>
          </View>
          {Boolean(backupOut) && (
            <TextInput style={[styles.input, styles.mono]} value={backupOut} multiline editable={false} />
          )}
          <Text style={styles.label}>Dán chuỗi backup để khôi phục</Text>
          <TextInput style={[styles.input, styles.mono]} value={restoreIn} onChangeText={setRestoreIn} multiline placeholder="Dán VEN1...." placeholderTextColor={Colors.textSecondary} />
          <TouchableOpacity style={styles.dangerBtn} onPress={handleValidateRestore}>
            <Text style={styles.primaryText}>♻️ Kiểm tra & khôi phục (ghi đè!)</Text>
          </TouchableOpacity>
          {Boolean(backupMsg) && <Text style={styles.msg}>{backupMsg}</Text>}
        </Card>

        <Card style={styles.card}>
          <Badge label="Tùy chọn" type="business" style={styles.badge} />
          <Text style={styles.title}>☁️ Đồng bộ cloud</Text>
          <Text style={styles.desc}>
            Giai đoạn 1 ưu tiên local (đúng PLAN). Khi 2 vợ chồng muốn xem chung 1 ví, hãy cung cấp
            Firebase/Supabase API key — app đã có sẵn khung SyncService, chỉ cần cắm config.
          </Text>
          <TouchableOpacity style={styles.ghostBtn} onPress={handleSyncInfo}>
            <Text style={styles.ghostText}>Kiểm tra trạng thái đồng bộ</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl * 2 },
  card: { padding: Spacing.lg },
  badge: { marginBottom: Spacing.sm, alignSelf: "flex-start" },
  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  desc: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 17 },
  label: { ...Typography.caption, fontWeight: "700", color: Colors.textPrimary, marginTop: Spacing.sm, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.button, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.bg },
  mono: { fontSize: 10, marginTop: Spacing.sm, maxHeight: 100 },
  msg: { fontSize: 12, color: Colors.primary, fontWeight: "600", marginTop: Spacing.sm },
  hint: { fontSize: 11, color: Colors.textSecondary, fontStyle: "italic", marginTop: 4 },
  row: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  primaryBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.button, paddingVertical: Spacing.sm, alignItems: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  ghostBtn: { marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.button, paddingVertical: Spacing.sm, alignItems: "center" },
  ghostText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  bioBtn: { marginTop: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.button, paddingVertical: Spacing.sm, alignItems: "center" },
  bioText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  disabledText: { opacity: 0.4 },
  dangerBtn: { marginTop: Spacing.md, backgroundColor: Colors.danger, borderRadius: BorderRadius.button, paddingVertical: Spacing.sm, alignItems: "center" },
});
