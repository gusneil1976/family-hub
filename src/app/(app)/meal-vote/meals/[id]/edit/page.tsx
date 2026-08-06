import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Category, Ingredient, Meal } from "@/lib/types";
import { MealForm } from "../../meal-form";
import { updateMeal } from "./actions";

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: meal } = await supabase
    .from("meals")
    .select("*")
    .eq("id", id)
    .single<Meal>();

  if (!meal) {
    notFound();
  }

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("*")
    .eq("meal_id", id)
    .order("sort_order")
    .returns<Ingredient[]>();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .returns<Category[]>();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {meal.name}
      </h1>
      <MealForm
        action={updateMeal.bind(null, meal.id)}
        meal={meal}
        ingredients={ingredients ?? []}
        categories={categories ?? []}
        submitLabel="Save changes"
      />
    </div>
  );
}
