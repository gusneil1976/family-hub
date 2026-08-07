import { requireSpendTrackerAccess } from "@/lib/auth";
import type { Profile, SpendBudget, SpendCategory } from "@/lib/types";
import { BudgetBar } from "../budget-bar";
import { formatGBP } from "../format";
import { MonthPicker } from "../month-picker";
import { monthDate, monthDateRange, monthKey, monthLabel, parseMonth } from "../month-utils";

type TransactionAmount = {
  category_id: string | null;
  spent_by: string;
  amount: number;
};

export default async function SpendReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase } = await requireSpendTrackerAccess();
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);
  const { startDate, endDate } = monthDateRange(year, month);
  const monthValue = monthDate(year, month);

  const [{ data: categories }, { data: people }, { data: transactions }, { data: budgets }] =
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
      supabase
        .from("spend_budgets")
        .select("*")
        .eq("month", monthValue)
        .returns<SpendBudget[]>(),
    ]);

  const people_ = people ?? [];
  const txns = transactions ?? [];
  const budgetByCategory = new Map((budgets ?? []).map((b) => [b.category_id, b.amount]));
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
  const totalBudget = [...budgetByCategory.values()].reduce((sum, b) => sum + b, 0);
  const visibleRows = rows.filter((row) => rowTotal(row.id) > 0);
  const budgetRows = rows.filter(
    (row) => row.id !== null && (rowTotal(row.id) > 0 || budgetByCategory.has(row.id)),
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Report</h1>

      <div className="mb-6">
        <MonthPicker value={monthKey(year, month)} />
      </div>

      {people_.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No one has Spend Tracker access yet.
        </p>
      ) : (
        <>
          <section className="mb-8 rounded-xl border border-card-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">
              Budget vs actual — {monthLabel(year, month)}
            </h2>
            <div className="space-y-4">
              <BudgetBar
                label="Total"
                actual={grandTotal}
                budget={totalBudget > 0 ? totalBudget : null}
                emphasize
              />
              {budgetRows.length > 0 && (
                <div className="space-y-3 border-t border-neutral-100 pt-3">
                  {budgetRows.map((row) => (
                    <BudgetBar
                      key={row.id}
                      label={row.name}
                      actual={rowTotal(row.id)}
                      budget={budgetByCategory.get(row.id as string) ?? null}
                    />
                  ))}
                </div>
              )}
            </div>
            {grandTotal === 0 && totalBudget === 0 && (
              <p className="mt-3 text-sm text-neutral-500">
                No budgets set and no transactions in {monthLabel(year, month)}.
              </p>
            )}
          </section>

          {visibleRows.length === 0 ? (
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
                    <td className="px-4 py-2 text-right">{formatGBP(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
