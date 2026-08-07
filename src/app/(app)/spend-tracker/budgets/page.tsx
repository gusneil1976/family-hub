import { requireSpendTrackerAccess } from "@/lib/auth";
import type { SpendBudget, SpendCategory } from "@/lib/types";
import { MonthPicker } from "../month-picker";
import { monthDate, monthKey, monthLabel, parseMonth, shiftMonth } from "../month-utils";
import { BudgetRow } from "./budget-row";
import { CopyBudgetsButton } from "./copy-budgets-button";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase } = await requireSpendTrackerAccess();
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);
  const monthValue = monthDate(year, month);
  const prev = shiftMonth(year, month, -1);
  const prevMonthValue = monthDate(prev.year, prev.month);

  const [{ data: categories }, { data: budgets }] = await Promise.all([
    supabase
      .from("spend_categories")
      .select("*")
      .order("name")
      .returns<SpendCategory[]>(),
    supabase
      .from("spend_budgets")
      .select("*")
      .eq("month", monthValue)
      .returns<SpendBudget[]>(),
  ]);

  const budgetByCategory = new Map(
    (budgets ?? []).map((b) => [b.category_id, b.amount]),
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Budgets</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Set a monthly spending target per category. Leave blank for no
        target.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MonthPicker value={monthKey(year, month)} />
        <CopyBudgetsButton month={monthValue} previousMonth={prevMonthValue} />
      </div>

      {categories?.length ? (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {categories.map((category) => (
            <BudgetRow
              key={category.id}
              categoryId={category.id}
              categoryName={category.name}
              month={monthValue}
              amount={budgetByCategory.get(category.id) ?? null}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">
          No categories yet — add some from the Categories page first.
        </p>
      )}

      <p className="mt-4 text-xs text-neutral-500">
        Copying from {monthLabel(prev.year, prev.month)}.
      </p>
    </div>
  );
}
