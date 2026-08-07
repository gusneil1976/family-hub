import type { RecurrenceUnit } from "@/lib/types";

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

export function addInterval(
  date: Date,
  unit: RecurrenceUnit,
  value: number,
): Date {
  const d = new Date(date);
  if (unit === "days") d.setDate(d.getDate() + value);
  if (unit === "weeks") d.setDate(d.getDate() + value * 7);
  if (unit === "months") d.setMonth(d.getMonth() + value);
  return d;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatRecurrence(
  unit: RecurrenceUnit | null,
  value: number | null,
): string | null {
  if (!unit || !value) return null;
  if (value === 1) {
    if (unit === "days") return "Daily";
    if (unit === "weeks") return "Weekly";
    if (unit === "months") return "Monthly";
  }
  return `Every ${value} ${unit}`;
}

export const DEFAULT_DUE_TIME = "20:00";

// due_time comes back from Postgres as "HH:MM:SS"; trim to "HH:MM" for
// consistent use in <input type="time"> and Date parsing.
export function normalizeTime(time: string | null): string {
  return (time ?? DEFAULT_DUE_TIME).slice(0, 5);
}

export function getDueDateTime(
  dueDate: string | null,
  dueTime: string | null,
): Date | null {
  if (!dueDate) return null;
  return new Date(`${dueDate}T${normalizeTime(dueTime)}`);
}

export function isOverdue(
  dueDate: string | null,
  dueTime: string | null,
): boolean {
  const dt = getDueDateTime(dueDate, dueTime);
  return dt !== null && dt < new Date();
}

export function formatDueDateTime(
  dueDate: string | null,
  dueTime: string | null,
): string | null {
  if (!dueDate) return null;
  const time = dueTime ? normalizeTime(dueTime) : DEFAULT_DUE_TIME;
  return `${dueDate} at ${time}`;
}
