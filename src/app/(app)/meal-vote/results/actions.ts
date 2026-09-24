"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireShoppingListAccess, requireUser } from "@/lib/auth";

export async function toggleChecklistItem(itemId: string, checked: boolean) {
  const { supabase } = await requireShoppingListAccess();

  const { error } = await supabase
    .from("shopping_checklist_items")
    .update({ checked })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/meal-vote/results");
}

// Admin-only — a cycle-wide setting (how many top-ranked meals the
// shopping list covers), not a personal shopping-list action.
export async function setShoppingListMealCount(cycleId: string, count: number) {
  const { supabase } = await requireAdmin();

  if (!Number.isFinite(count) || count < 1) {
    throw new Error("Invalid count.");
  }

  const { error } = await supabase
    .from("voting_cycles")
    .update({ shopping_list_meal_count: count })
    .eq("id", cycleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/meal-vote/results");
}

// Seeds a tick-off row for each of the current top-N meals' ingredients.
// Called by the results page's checklist query before it reads the rows —
// only whoever has shopping-list access seeds new rows; for anyone else this
// is a no-op and they just read whatever's already there (RLS allows select
// for all). Existing rows (and their ticks) are left alone.
export async function ensureChecklistItems(
  cycleId: string,
  ingredientIds: string[],
) {
  const { supabase, profile } = await requireUser();
  if (!profile?.has_shopping_list_access || ingredientIds.length === 0) return;

  await supabase.from("shopping_checklist_items").upsert(
    ingredientIds.map((ingredientId) => ({
      voting_cycle_id: cycleId,
      ingredient_id: ingredientId,
      checked: false,
    })),
    { onConflict: "voting_cycle_id,ingredient_id", ignoreDuplicates: true },
  );
}
