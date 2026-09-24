"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useBudgets, useSpendCategories } from "../data";
import { MonthPicker } from "../month-picker";
import { monthDate, monthKey, monthLabel, parseMonth, shiftMonth } from "../month-utils";
import { BudgetRow } from "./budget-row";
import { CopyBudgetsButton } from "./copy-budgets-button";

// The month comes from ?month=, which needs a Suspense boundary on a client page.
export default function BudgetsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BudgetsScreen />
    </Suspense>
  );
}

function BudgetsScreen() {
  const me = useRequireAccess((p) => p.has_spend_tracker_access);
  const { year, month } = parseMonth(useSearchParams().get("month") ?? undefined);
  const monthValue = monthDate(year, month);
  const prev = shiftMonth(year, month, -1);
  const prevMonthValue = monthDate(prev.year, prev.month);

  const categoriesQuery = useSpendCategories();
  const budgetsQuery = useBudgets(year, month);
  // Loaded quietly so "Copy from previous month" can fill the rows in
  // instantly rather than waiting for the server.
  useBudgets(prev.year, prev.month);

  if (!me || !categoriesQuery.data || !budgetsQuery.data) return <Loading />;

  const categories = categoriesQuery.data;
  const budgetByCategory = new Map(
    budgetsQuery.data.map((b) => [b.category_id, b.amount]),
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

      {categories.length ? (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {categories.map((category) => {
            const amount = budgetByCategory.get(category.id) ?? null;
            return (
              <BudgetRow
                // Keyed by month and amount too, so switching month or a
                // copy/re-sync bringing a new figure resets the input box.
                key={`${monthValue}:${category.id}:${amount}`}
                categoryId={category.id}
                categoryName={category.name}
                month={monthValue}
                amount={amount}
              />
            );
          })}
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
