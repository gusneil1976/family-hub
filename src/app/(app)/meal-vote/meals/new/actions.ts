"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parseIngredientRows } from "../parse-ingredients";
import type { MealFormState } from "../meal-form";
import { uploadMealImage } from "../upload-meal-image";

export async function createMeal(
  _prevState: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const { supabase, user } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Meal name is required." };
  }

  const servingsRaw = formData.get("servings");
  const servings = servingsRaw ? Number(servingsRaw) : null;
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const sourceUrl = String(formData.get("source_url") ?? "").trim() || null;
  const externalImageUrl =
    String(formData.get("external_image_url") ?? "").trim() || null;

  const { data: meal, error: mealError } = await supabase
    .from("meals")
    .insert({
      name,
      servings,
      recipe_body: String(formData.get("recipe_body") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      owner_id: user.id,
      category_id: categoryId,
      source_url: sourceUrl,
      image_url: externalImageUrl,
    })
    .select("id")
    .single();

  if (mealError || !meal) {
    return { error: mealError?.message ?? "Failed to create meal." };
  }

  const ingredientRows = parseIngredientRows(formData);
  if (ingredientRows.length > 0) {
    const { error: ingredientsError } = await supabase
      .from("ingredients")
      .insert(ingredientRows.map((row) => ({ ...row, meal_id: meal.id })));

    if (ingredientsError) {
      return { error: ingredientsError.message };
    }
  }

  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const { url, error: imageError } = await uploadMealImage(
      supabase,
      meal.id,
      imageFile,
    );
    if (imageError) {
      return { error: imageError };
    }
    if (url) {
      const { error: updateError } = await supabase
        .from("meals")
        .update({ image_url: url })
        .eq("id", meal.id);
      if (updateError) {
        return { error: updateError.message };
      }
    }
  }

  redirect(`/meal-vote/meals/${meal.id}`);
}
