import Link from "next/link";
import { requireSpendTrackerAccess } from "@/lib/auth";
import type { Profile, SpendCategory } from "@/lib/types";
import { formatGBP } from "../format";

type TransactionAmount = {
  category_id: string | null;
  spent_by: string;
  amount: number;
};

function parseMonth(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNum] = month.split("-").map(Number);
    return { year, month: monthNum };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export default async function SpendReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase } = await requireSpendTrackerAccess();
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);

  const startDate = `${monthKey(year, month)}-01`;
  const nextMonth = shiftMonth(year, month, 1);
  const endDate = `${monthKey(nextMonth.year, nextMonth.month)}-01`;

  const [{ data: categories }, { data: people }, { data: transactions }] =
    await Promise.all([
      supabase
        .from("spend_categories")
        .select("*")
        .order("name")
        .returns<SpendCategory[]>(),
      supabase
        .from("profiles")
        .select("*")
        .eq("has_spend_tracker_access", true)
        .order("display_name")
        .returns<Profile[]>(),
      supabase
        .from("spend_transactions")
        .select("category_id, spent_by, amount")
        .gte("date", startDate)
        .lt("date", endDate)
        .returns<TransactionAmount[]>(),
    ]);

  const people_ = people ?? [];
  const txns = transactions ?? [];
  const rows = [
    ...(categories ?? []).map((c) => ({ id: c.id as string | null, name: c.name })),
    { id: null, name: "Uncategorized" },
  ];

  const cell = (categoryId: string | null, personId: string) =>
    txns
      .filter((t) => t.category_id === categoryId && t.spent_by === personId)
      .reduce((sum, t) => sum + t.amount, 0);

  const rowTotal = (categoryId: string | null) =>
    txns
      .filter((t) => t.category_id === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);

  const colTotal = (personId: string) =>
    txns
      .filter((t) => t.spent_by === personId)
      .reduce((sum, t) => sum + t.amount, 0);

  const grandTotal = txns.reduce((sum, t) => sum + t.amount, 0);
  const visibleRows = rows.filter((row) => rowTotal(row.id) > 0);

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Report</h1>

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/spend-tracker/report?month=${monthKey(prev.year, prev.month)}`}
          className="text-sm text-neutral-500 underline hover:text-neutral-900"
        >
          ← Previous
        </Link>
        <span className="text-sm font-medium text-foreground">
          {monthLabel(year, month)}
        </span>
        <Link
          href={`/spend-tracker/report?month=${monthKey(next.year, next.month)}`}
          className="text-sm text-neutral-500 underline hover:text-neutral-900"
        >
          Next →
        </Link>
      </div>

      {people_.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No one has Spend Tracker access yet.
        </p>
      ) : visibleRows.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No transactions in {monthLabel(year, month)}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-2 text-left font-semibold text-neutral-700">
                  Category
                </th>
                {people_.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-2 text-right font-semibold text-neutral-700"
                  >
                    {p.display_name}
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-semibold text-neutral-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id ?? "uncategorized"}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-2 text-neutral-900">{row.name}</td>
                  {people_.map((p) => (
                    <td key={p.id} className="px-4 py-2 text-right">
                      {formatGBP(cell(row.id, p.id))}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-medium">
                    {formatGBP(rowTotal(row.id))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-200 font-semibold">
                <td className="px-4 py-2">Total</td>
                {people_.map((p) => (
                  <td key={p.id} className="px-4 py-2 text-right">
                    {formatGBP(colTotal(p.id))}
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  {formatGBP(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
