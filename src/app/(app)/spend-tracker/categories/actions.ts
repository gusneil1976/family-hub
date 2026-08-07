"use server";

import { revalidatePath } from "next/cache";
import { requireSpendTrackerAccess } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function addCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSpendTrackerAccess();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Category name is required." };
  }

  const { error } = await supabase.from("spend_categories").insert({ name });
  if (error) {
    return {
      error:
        error.code === "23505" ? "That category already exists." : error.message,
    };
  }

  revalidatePath("/spend-tracker/categories");
  revalidatePath("/spend-tracker/new");
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireSpendTrackerAccess();

  const { error } = await supabase
    .from("spend_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/spend-tracker/categories");
}
