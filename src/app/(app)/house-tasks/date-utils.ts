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

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate + "T23:59:59") < new Date();
}
