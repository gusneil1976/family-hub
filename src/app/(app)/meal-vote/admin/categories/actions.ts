"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function addCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Category name is required." };
  }

  const { error } = await supabase.from("categories").insert({ name });
  if (error) {
    return {
      error: error.code === "23505" ? "That category already exists." : error.message,
    };
  }

  revalidatePath("/meal-vote/admin/categories");
  revalidatePath("/meal-vote/meals/new");
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/meal-vote/admin/categories");
}
