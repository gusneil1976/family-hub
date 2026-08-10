import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { requireUser } from "@/lib/auth";
import type { Ingredient, Meal, VotingCycle } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { MealImage } from "../meals/meal-image";
import { ShoppingChecklist, type ChecklistIngredient } from "./checklist";

type ShortlistRow = { meal_id: string; meals: Meal };

const RANK_LABELS = ["1st", "2nd", "3rd"];
const RANK_STYLES = ["bg-accent", "bg-neutral-500", "bg-amber-700"];

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

  const totalVotes = votes?.length ?? 0;

  const ranked = (shortlist ?? [])
    .slice()
    .sort(
      (a, b) =>
        (voteCounts.get(b.meal_id) ?? 0) - (voteCounts.get(a.meal_id) ?? 0),
    );

  // A "winner" only exists once at least one vote has actually been cast —
  // otherwise ranked[0] is just the first shortlist entry, not a leader.
  const winnerEntry = totalVotes > 0 ? ranked[0] : undefined;
  const winner = winnerEntry?.meals;

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
          totalVotes === 0
            ? "This week's shortlist"
            : cycle.status === "live"
              ? "Leading so far"
              : "This week's winner"
        }
        description={totalVotes === 0 ? "No votes cast yet." : undefined}
      />

      {ranked.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No shortlist for this cycle.
        </p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ranked.map((entry, i) => {
              const meal = entry.meals;
              const count = voteCounts.get(entry.meal_id) ?? 0;
              return (
                <Link
                  key={entry.meal_id}
                  href={`/meal-vote/meals/${meal.id}`}
                  className="relative block overflow-hidden rounded-xl border border-card-border bg-card shadow-sm transition-colors hover:border-accent"
                >
                  {meal.image_url ? (
                    <MealImage
                      src={meal.image_url}
                      alt=""
                      className="h-44 w-full object-cover sm:h-48"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-neutral-100 sm:h-48">
                      <UtensilsCrossed className="h-10 w-10 text-neutral-300" />
                    </div>
                  )}
                  {totalVotes > 0 && i < 3 && (
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow ${RANK_STYLES[i]}`}
                    >
                      {RANK_LABELS[i]}
                    </span>
                  )}
                  <div className="px-4 py-3">
                    <p className="text-base font-medium text-neutral-900">
                      {meal.name}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {count} vote{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {profile?.is_admin && checklistItems.length > 0 && (
            <ShoppingChecklist items={checklistItems} />
          )}
        </>
      )}
    </div>
  );
}
