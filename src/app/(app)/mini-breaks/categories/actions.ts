"use server";

import { revalidatePath } from "next/cache";
import { requireMiniBreaksAccess } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function addCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireMiniBreaksAccess();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Category name is required." };
  }

  const { error } = await supabase
    .from("mini_break_url_categories")
    .insert({ name });
  if (error) {
    return {
      error:
        error.code === "23505" ? "That category already exists." : error.message,
    };
  }

  revalidatePath("/mini-breaks/categories");
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireMiniBreaksAccess();

  const { error } = await supabase
    .from("mini_break_url_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/mini-breaks/categories");
}
