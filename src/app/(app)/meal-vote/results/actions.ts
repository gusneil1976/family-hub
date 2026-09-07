"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireShoppingListAccess } from "@/lib/auth";

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
