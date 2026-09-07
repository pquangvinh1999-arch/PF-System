/**
 * Utility tính toán lịch tháng và định dạng ngày/tiền tệ cho CalendarGrid
 */

export const CalendarUtils = {
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  },

  /**
   * Trả về chỉ số thứ của ngày 1 trong tháng
   * Thứ 2 = 0, Thứ 3 = 1, ..., Chủ Nhật = 6
   */
  getFirstDayOfWeek(year: number, month: number): number {
    const day = new Date(year, month - 1, 1).getDay();
    // getDay() trả về 0 = CN, 1 = T2, ..., 6 = T7
    return day === 0 ? 6 : day - 1;
  },

  formatDateString(year: number, month: number, day: number): string {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  },

  getTodayString(): string {
    const now = new Date();
    return this.formatDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
  },

  formatShortCurrency(amount: number): string {
    if (amount <= 0) return "";
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    }
    if (amount >= 1000) {
      const thousands = amount / 1000;
      return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(0)}k`;
    }
    return `${amount}`;
  },
};
