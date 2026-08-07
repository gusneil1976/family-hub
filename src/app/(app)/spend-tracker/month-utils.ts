export function parseMonth(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNum] = month.split("-").map(Number);
    return { year, month: monthNum };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

// For gte/lt range queries against a `date` column.
export function monthDateRange(year: number, month: number) {
  const startDate = `${monthKey(year, month)}-01`;
  const next = shiftMonth(year, month, 1);
  const endDate = `${monthKey(next.year, next.month)}-01`;
  return { startDate, endDate };
}

// The first-of-month `date` value stored in spend_budgets.month.
export function monthDate(year: number, month: number) {
  return `${monthKey(year, month)}-01`;
}

// 24 months back through 1 month ahead of today, for the month dropdown.
export function monthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = -24; i <= 1; i++) {
    const { year, month } = shiftMonth(now.getFullYear(), now.getMonth() + 1, i);
    options.push({ value: monthKey(year, month), label: monthLabel(year, month) });
  }
  return options.reverse();
}
