"use server";

import { revalidatePath } from "next/cache";
import { requireSpendTrackerAccess } from "@/lib/auth";
import type { SpendBudget } from "@/lib/types";

export async function setBudget(
  categoryId: string,
  month: string,
  amountValue: string,
) {
  const { supabase } = await requireSpendTrackerAccess();

  const amount = Number(amountValue);
  const clear = !amountValue.trim() || !Number.isFinite(amount) || amount <= 0;

  if (clear) {
    const { error } = await supabase
      .from("spend_budgets")
      .delete()
      .eq("category_id", categoryId)
      .eq("month", month);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("spend_budgets")
      .upsert(
        { category_id: categoryId, month, amount },
        { onConflict: "category_id,month" },
      );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/spend-tracker/budgets");
  revalidatePath("/spend-tracker/report");
}

// Prefills any category that doesn't already have a budget for `month` with
// its amount from the previous month — safe to click after making manual
// tweaks, since categories already set for `month` are left untouched.
export async function copyBudgetsFromPreviousMonth(
  month: string,
  previousMonth: string,
) {
  const { supabase } = await requireSpendTrackerAccess();

  const [{ data: current }, { data: previous }] = await Promise.all([
    supabase
      .from("spend_budgets")
      .select("category_id")
      .eq("month", month)
      .returns<Pick<SpendBudget, "category_id">[]>(),
    supabase
      .from("spend_budgets")
      .select("category_id, amount")
      .eq("month", previousMonth)
      .returns<Pick<SpendBudget, "category_id" | "amount">[]>(),
  ]);

  const alreadySet = new Set((current ?? []).map((b) => b.category_id));
  const toInsert = (previous ?? [])
    .filter((b) => !alreadySet.has(b.category_id))
    .map((b) => ({ category_id: b.category_id, month, amount: b.amount }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("spend_budgets").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/spend-tracker/budgets");
  revalidatePath("/spend-tracker/report");
}
