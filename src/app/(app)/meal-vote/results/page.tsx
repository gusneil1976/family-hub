import { requireUser } from "@/lib/auth";
import type { Ingredient, Meal, VotingCycle } from "@/lib/types";
import { Card, PageHeader } from "@/components/ui";
import { MealImage } from "../meals/meal-image";
import { ShoppingChecklist, type ChecklistIngredient } from "./checklist";

type ShortlistRow = { meal_id: string; meals: Meal };

export default async function ResultsPage() {
  const { supabase, profile } = await requireUser();

  const { data: cycle } = await supabase
    .from("voting_cycles")
    .select("*")
    .in("status", ["live", "closed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<VotingCycle>();

  if (!cycle) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Results
        </h1>
        <p className="text-sm text-neutral-500">
          No voting cycle has run yet.
        </p>
      </div>
    );
  }

  const { data: shortlist } = await supabase
    .from("shortlist_entries")
    .select("meal_id, meals(*)")
    .eq("voting_cycle_id", cycle.id)
    .returns<ShortlistRow[]>();

  const { data: votes } = await supabase
    .from("votes")
    .select("meal_id")
    .eq("voting_cycle_id", cycle.id);

  const voteCounts = new Map<string, number>();
  votes?.forEach((v) => {
    voteCounts.set(v.meal_id, (voteCounts.get(v.meal_id) ?? 0) + 1);
  });

  const ranked = (shortlist ?? [])
    .slice()
    .sort(
      (a, b) =>
        (voteCounts.get(b.meal_id) ?? 0) - (voteCounts.get(a.meal_id) ?? 0),
    );

  const winnerEntry = ranked[0];
  const winner = winnerEntry?.meals;
  const winnerVotes = winnerEntry
    ? (voteCounts.get(winnerEntry.meal_id) ?? 0)
    : 0;

  const { data: ingredients } = winner
    ? await supabase
        .from("ingredients")
        .select("*")
        .eq("meal_id", winner.id)
        .order("sort_order")
        .returns<Ingredient[]>()
    : { data: null };

  let checklistItems: ChecklistIngredient[] = [];

  if (profile?.is_admin && winner && ingredients?.length) {
    await supabase.from("shopping_checklist_items").upsert(
      ingredients.map((ing) => ({
        voting_cycle_id: cycle.id,
        ingredient_id: ing.id,
        checked: false,
      })),
      { onConflict: "voting_cycle_id,ingredient_id", ignoreDuplicates: true },
    );

    const { data: items } = await supabase
      .from("shopping_checklist_items")
      .select("*")
      .eq("voting_cycle_id", cycle.id);

    const itemByIngredient = new Map(items?.map((i) => [i.ingredient_id, i]));
    checklistItems = ingredients.map((ing) => {
      const item = itemByIngredient.get(ing.id);
      return {
        itemId: item?.id ?? ing.id,
        ingredientId: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        checked: item?.checked ?? false,
      };
    });
  }

  return (
    <div>
      <PageHeader
        title={
          cycle.status === "live" ? "Leading so far" : "This week's winner"
        }
      />

      {!winner ? (
        <p className="text-sm text-neutral-500">No votes yet.</p>
      ) : (
        <>
          {winner.image_url && (
            <MealImage
              src={winner.image_url}
              alt={winner.name}
              className="mb-3 h-56 w-full rounded-xl object-cover"
            />
          )}

          <div className="mb-4">
            <p className="text-sm text-neutral-500">
              {winner.name} — {winnerVotes} vote{winnerVotes === 1 ? "" : "s"}
            </p>
            {winner.source_url && (
              <p className="mt-1 text-sm">
                <a
                  href={winner.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 underline hover:text-neutral-900"
                >
                  View original recipe ↗
                </a>
              </p>
            )}
          </div>

          <Card className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              Ingredients
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-800">
              {ingredients?.map((ing) => (
                <li key={ing.id}>
                  {[ing.quantity, ing.unit, ing.name]
                    .filter(Boolean)
                    .join(" ")}
                </li>
              ))}
            </ul>
          </Card>

          {winner.recipe_body && (
            <Card className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                Recipe
              </h2>
              <p className="whitespace-pre-wrap text-sm text-neutral-800">
                {winner.recipe_body}
              </p>
            </Card>
          )}

          {profile?.is_admin && checklistItems.length > 0 && (
            <ShoppingChecklist items={checklistItems} />
          )}
        </>
      )}
    </div>
  );
}
