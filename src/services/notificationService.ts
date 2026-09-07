import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { PlannedExpense } from "../types";
import { CashFlowForecastService } from "../features/calendar/services/CashFlowForecastService";

// Cấu hình handler hiển thị notification khi app đang mở
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationScheduleResult {
  success: boolean;
  notificationId?: string;
  triggerDate?: string;
  error?: string;
}

export class NotificationService {
  public static DEFAULT_REMIND_DAYS_BEFORE = 7;

  /**
   * Yêu cầu quyền gửi thông báo từ người dùng
   */
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "web") return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return false;
      }

      // Android: Thiết lập notification channel chuẩn
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("planned-expenses", {
          name: "Nhắc hạn chi tiêu",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0F6E5B",
          sound: "default",
        });
      }

      return true;
    } catch (err) {
      console.warn("Lỗi yêu cầu quyền notification:", err);
      return false;
    }
  }

  /**
   * Tính toán thời điểm trigger nhắc hạn dựa trên due_date và số ngày nhắc trước
   * Mặc định vào lúc 09:00:00 sáng
   */
  static calculateTriggerDate(dueDateStr: string, daysBefore: number = this.DEFAULT_REMIND_DAYS_BEFORE): Date {
    const [year, month, day] = dueDateStr.split("-").map((v) => parseInt(v, 10));
    // Lưu ý: month trong Date constructor là 0-indexed
    const targetDate = new Date(year, month - 1, day, 9, 0, 0, 0);
    targetDate.setDate(targetDate.getDate() - daysBefore);
    return targetDate;
  }

  /**
   * Định dạng thông điệp nhắc hạn thân thiện
   */
  static generateReminderContent(expense: PlannedExpense, daysBefore: number) {
    const formattedAmount = CashFlowForecastService.formatCurrency(expense.amount);
    const title = `🔔 Nhắc hạn: ${expense.title}`;
    const body = `Khoản chi ${formattedAmount} sẽ đến hạn vào ngày ${expense.due_date} (${daysBefore} ngày nữa). Hãy chuẩn bị sẵn dòng tiền!`;
    return { title, body };
  }

  /**
   * Lên lịch nhắc nhở hạn chi tiêu cho 1 PlannedExpense
   */
  static async schedulePlannedExpenseReminder(
    expense: PlannedExpense,
    daysBefore: number = this.DEFAULT_REMIND_DAYS_BEFORE
  ): Promise<NotificationScheduleResult> {
    // Không nhắc những khoản chi đã thanh toán
    if (expense.status === "paid") {
      return { success: false, error: "Khoản chi đã thanh toán, không cần nhắc hạn" };
    }

    const triggerDate = this.calculateTriggerDate(expense.due_date, daysBefore);
    const now = new Date();

    // Nếu ngày trigger đã qua quá 1 ngày so với ngày đến hạn
    const [y, m, d] = expense.due_date.split("-").map((v) => parseInt(v, 10));
    const dueDateTime = new Date(y, m - 1, d, 23, 59, 59);

    if (now > dueDateTime) {
      return { success: false, error: "Khoản chi đã quá hạn" };
    }

    // Nếu thời điểm trigger đã qua nhưng chưa tới due date, đặt trigger vào 1 phút sau
    const effectiveTrigger = triggerDate <= now ? new Date(Date.now() + 60 * 1000) : triggerDate;

    if (Platform.OS === "web") {
      return {
        success: true,
        notificationId: `web_notif_${expense.id}`,
        triggerDate: effectiveTrigger.toISOString(),
      };
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { success: false, error: "Chưa được cấp quyền gửi thông báo" };
      }

      const { title, body } = this.generateReminderContent(expense, daysBefore);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            expenseId: expense.id,
            dueDate: expense.due_date,
            amount: expense.amount,
            type: "planned_expense_reminder",
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: effectiveTrigger,
        },
      });

      return {
        success: true,
        notificationId,
        triggerDate: effectiveTrigger.toISOString(),
      };
    } catch (err: any) {
      console.warn("Lỗi schedule notification:", err);
      return { success: false, error: err.message || "Không thể lên lịch thông báo" };
    }
  }

  /**
   * Huỷ thông báo đã lên lịch
   */
  static async cancelNotification(notificationId: string): Promise<boolean> {
    if (Platform.OS === "web" || !notificationId) return true;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (err) {
      console.warn("Lỗi huỷ notification:", err);
      return false;
    }
  }

  /**
   * Huỷ toàn bộ thông báo đã lên lịch
   */
  static async cancelAllNotifications(): Promise<boolean> {
    if (Platform.OS === "web") return true;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (err) {
      console.warn("Lỗi huỷ toàn bộ notifications:", err);
      return false;
    }
  }

  /**
   * Lấy danh sách các khoản chi sắp đến hạn trong vòng N ngày tới
   */
  static getUpcomingExpensesWithinDays(
    expenses: PlannedExpense[],
    days: number = this.DEFAULT_REMIND_DAYS_BEFORE
  ): PlannedExpense[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + days);
    maxDate.setHours(23, 59, 59, 999);

    return expenses.filter((e) => {
      if (e.status === "paid") return false;
      const [y, m, d] = e.due_date.split("-").map((v) => parseInt(v, 10));
      const expDate = new Date(y, m - 1, d);
      return expDate >= today && expDate <= maxDate;
    }).sort((a, b) => a.due_date.localeCompare(b.due_date));
  }
}
