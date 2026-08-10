"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { parseIngredientRows } from "../../parse-ingredients";
import type { MealFormState } from "../../meal-form";
import { uploadMealImage } from "../../upload-meal-image";

export async function updateMeal(
  mealId: string,
  _prevState: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Meal name is required." };
  }

  const servingsRaw = formData.get("servings");
  const servings = servingsRaw ? Number(servingsRaw) : null;
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const sourceUrl = String(formData.get("source_url") ?? "").trim() || null;

  const { error: mealError } = await supabase
    .from("meals")
    .update({
      name,
      servings,
      recipe_body: String(formData.get("recipe_body") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      category_id: categoryId,
      source_url: sourceUrl,
    })
    .eq("id", mealId);

  if (mealError) {
    return { error: mealError.message };
  }

  // Simplest correct approach for v1: replace all ingredient rows on save
  // rather than diffing which changed.
  const { error: deleteError } = await supabase
    .from("ingredients")
    .delete()
    .eq("meal_id", mealId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const ingredientRows = parseIngredientRows(formData);
  if (ingredientRows.length > 0) {
    const { error: ingredientsError } = await supabase
      .from("ingredients")
      .insert(ingredientRows.map((row) => ({ ...row, meal_id: mealId })));

    if (ingredientsError) {
      return { error: ingredientsError.message };
    }
  }

  const imageFile = formData.get("image");
  const removeImage = formData.get("remove_image") === "on";

  if (imageFile instanceof File && imageFile.size > 0) {
    const { url, error: imageError } = await uploadMealImage(
      supabase,
      mealId,
      imageFile,
    );
    if (imageError) {
      return { error: imageError };
    }
    if (url) {
      const { error: updateError } = await supabase
        .from("meals")
        .update({ image_url: url })
        .eq("id", mealId);
      if (updateError) {
        return { error: updateError.message };
      }
    }
  } else if (removeImage) {
    const { error: updateError } = await supabase
      .from("meals")
      .update({ image_url: null })
      .eq("id", mealId);
    if (updateError) {
      return { error: updateError.message };
    }
  }

  redirect(`/meal-vote/meals/${mealId}`);
}

export async function deleteMeal(mealId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("meals").delete().eq("id", mealId);

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("foreign key")
        ? "Can't delete — this meal has voting history. Untick 'Weekly meal' on the meal library instead."
        : error.message,
    );
  }

  revalidatePath("/meal-vote/meals");
}
