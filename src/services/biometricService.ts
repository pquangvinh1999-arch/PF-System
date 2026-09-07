import * as LocalAuthentication from "expo-local-authentication";
import { LockService } from "./lockService";

export type BiometricStatus = "available" | "unavailable" | "not_enrolled" | "unknown";

export const BiometricService = {
  async getStatus(): Promise<{ status: BiometricStatus; hasHardware: boolean; enrolled: boolean }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware) return { status: "unavailable", hasHardware, enrolled };
      if (!enrolled) return { status: "not_enrolled", hasHardware, enrolled };
      return { status: "available", hasHardware, enrolled };
    } catch {
      return { status: "unknown", hasHardware: false, enrolled: false };
    }
  },

  async authenticate(reason = "Mở khóa app Vén"): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: "Dùng mã PIN",
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  },

  verifyPin(pin: string, hash: string): boolean {
    return LockService.verifyPin(pin, hash);
  },
};
