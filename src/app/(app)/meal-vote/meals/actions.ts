"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function setWeeklyMeal(mealId: string, isWeekly: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("meals")
    .update({ is_weekly_meal: isWeekly })
    .eq("id", mealId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/meal-vote/meals");
}
