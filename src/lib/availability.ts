import { DateTime } from "luxon";
import { parseTime } from "./time";
import type { AvailabilityRule } from "../config/availability";

export function isAvailableNow(
  rule: AvailabilityRule,
  timezone: string
): boolean {
  const now = DateTime.now().setZone(timezone);

  const day = now.toFormat("ccc").toUpperCase();

  if (!rule.days.includes(day as any)) {
    return false;
  }

  const start = parseTime(rule.startTime);
  const end = parseTime(rule.endTime);

  // SAFE fallback (important for production resilience)
  if (!start || !end) return true;

  const currentMinutes = now.hour * 60 + now.minute;

  const startMinutes =
    start.hour * 60 + start.minute;

  const endMinutes =
    end.hour * 60 + end.minute;

  // normal case
  if (startMinutes <= endMinutes) {
    return (
      currentMinutes >= startMinutes &&
      currentMinutes <= endMinutes
    );
  }

  // 🔥 overnight support (e.g. 22:00 → 02:00)
  return (
    currentMinutes >= startMinutes ||
    currentMinutes <= endMinutes
  );
}