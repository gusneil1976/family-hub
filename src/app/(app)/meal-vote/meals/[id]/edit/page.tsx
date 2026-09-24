"use client";

import { useParams } from "next/navigation";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../../../loading";
import { useMeal, useMealCategories, useMealIngredients } from "../../../data";
import { MealForm } from "../../meal-form";
import { MealNotFound } from "../../meal-not-found";
import { updateMeal } from "./actions";
import { DeleteMealButton } from "./delete-meal-button";

export default function EditMealPage() {
  const { id } = useParams<{ id: string }>();
  const me = useRequireAccess((p) => p.is_admin);
  const mealQuery = useMeal(id);
  const ingredientsQuery = useMealIngredients(id);
  const categoriesQuery = useMealCategories();

  if (
    !me ||
    mealQuery.data === undefined ||
    !ingredientsQuery.data ||
    !categoriesQuery.data
  ) {
    return <Loading />;
  }

  const meal = mealQuery.data;
  if (!meal) return <MealNotFound />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {meal.name}
      </h1>
      <MealForm
        action={updateMeal.bind(null, meal.id)}
        syncKeys={[["meals"], ["meal", meal.id], ["ingredients", meal.id]]}
        meal={meal}
        ingredients={ingredientsQuery.data}
        categories={categoriesQuery.data}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteMealButton mealId={meal.id} />
      </div>
    </div>
  );
}
