"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function toggleChecklistItem(itemId: string, checked: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("shopping_checklist_items")
    .update({ checked })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/meal-vote/results");
}
