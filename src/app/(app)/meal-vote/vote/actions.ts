"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function submitVotes(
  cycleId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const mealIds = formData.getAll("meal_id").map(String);
  if (mealIds.length === 0) {
    return { error: "Pick at least one meal." };
  }
  if (mealIds.length > 3) {
    return { error: "You can only pick up to 3 meals." };
  }

  const { error: deleteError } = await supabase
    .from("votes")
    .delete()
    .eq("voting_cycle_id", cycleId)
    .eq("voter_id", user.id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: insertError } = await supabase.from("votes").insert(
    mealIds.map((meal_id, i) => ({
      voting_cycle_id: cycleId,
      voter_id: user.id,
      meal_id,
      rank: i + 1,
    })),
  );
  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/meal-vote/vote");
  revalidatePath("/meal-vote/admin/shortlist");
  revalidatePath("/meal-vote/results");
}
