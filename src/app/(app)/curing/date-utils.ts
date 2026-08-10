// due_date/start_date are plain "YYYY-MM-DD" strings with no time
// component — parsed as UTC midnight by `new Date(...)` per spec, so plain
// day arithmetic here is safe regardless of server timezone.

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(`${fromStr}T00:00:00Z`).getTime();
  const to = new Date(`${toStr}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export type DurationUnit = "hours" | "days" | "weeks";

// Adds a duration in the given unit to a (date, time) anchor. Day/week
// durations applied to a time-less anchor stay time-less (the common case,
// identical to plain addDays()) — a due_time only appears once an hours
// unit, or an already-timed anchor, is actually involved.
export function addDuration(
  dueDate: string,
  dueTime: string | null,
  value: number,
  unit: DurationUnit,
): { due_date: string; due_time: string | null } {
  if (unit !== "hours" && !dueTime) {
    const days = unit === "weeks" ? value * 7 : value;
    return { due_date: addDays(dueDate, days), due_time: null };
  }
  const hours = unit === "hours" ? value : unit === "weeks" ? value * 168 : value * 24;
  const base = new Date(`${dueDate}T${dueTime ?? "00:00"}:00Z`);
  base.setUTCHours(base.getUTCHours() + hours);
  const iso = base.toISOString();
  return { due_date: iso.slice(0, 10), due_time: iso.slice(11, 16) };
}
