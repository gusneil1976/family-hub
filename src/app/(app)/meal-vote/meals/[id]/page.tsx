import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Ingredient, Meal } from "@/lib/types";
import { MealImage } from "../meal-image";

type MealRow = Meal & { categories: { name: string } | null };

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();

  const { data: meal } = await supabase
    .from("meals")
    .select("*, categories(name)")
    .eq("id", id)
    .single<MealRow>();

  if (!meal) {
    notFound();
  }

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("*")
    .eq("meal_id", id)
    .order("sort_order")
    .returns<Ingredient[]>();

  return (
    <div>
      {meal.image_url && (
        <MealImage
          src={meal.image_url}
          alt={meal.name}
          className="mb-4 h-56 w-full rounded-md object-cover"
        />
      )}

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {meal.name}
          </h1>
          <p className="text-sm text-neutral-500">
            {meal.categories?.name && <span>{meal.categories.name}</span>}
            {meal.categories?.name && meal.servings && " · "}
            {meal.servings && <span>Serves {meal.servings}</span>}
          </p>
          {meal.is_weekly_meal && (
            <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Weekly meal
            </span>
          )}
          {meal.source_url && (
            <p className="mt-1 text-sm">
              <a
                href={meal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 underline hover:text-neutral-900"
              >
                View original recipe ↗
              </a>
            </p>
          )}
        </div>
        {profile?.is_admin && (
          <Link
            href={`/meal-vote/meals/${meal.id}/edit`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Edit
          </Link>
        )}
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          Ingredients
        </h2>
        {ingredients?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-800">
            {ingredients.map((ing) => (
              <li key={ing.id}>
                {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(" ")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No ingredients listed.</p>
        )}
      </section>

      {meal.recipe_body && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">
            Recipe
          </h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-800">
            {meal.recipe_body}
          </p>
        </section>
      )}

      {meal.notes && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-800">
            {meal.notes}
          </p>
        </section>
      )}
    </div>
  );
}
