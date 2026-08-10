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

function MealGrid({
  entries,
  points,
  totalVotes,
  dimmed,
  rankOffset,
}: {
  entries: ShortlistRow[];
  points: Map<string, number>;
  totalVotes: number;
  dimmed?: boolean;
  rankOffset: number;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${dimmed ? "opacity-60 grayscale" : ""}`}
    >
      {entries.map((entry, i) => {
        const meal = entry.meals;
        const pointTotal = points.get(entry.meal_id) ?? 0;
        const globalRank = rankOffset + i;
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
            {totalVotes > 0 && globalRank < 3 && (
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow ${RANK_STYLES[globalRank]}`}
              >
                {RANK_LABELS[globalRank]}
              </span>
            )}
            <div className="px-4 py-3">
              <p className="text-base font-medium text-neutral-900">
                {meal.name}
              </p>
              <p className="mt-0.5 text-sm text-neutral-500">
                {pointTotal} point{pointTotal === 1 ? "" : "s"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

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
    .select("meal_id, rank")
    .eq("voting_cycle_id", cycle.id);

  // 1st choice = 3 points, 2nd = 2, 3rd = 1.
  const POINTS_BY_RANK: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
  const points = new Map<string, number>();
  votes?.forEach((v) => {
    const weight = POINTS_BY_RANK[v.rank] ?? 0;
    points.set(v.meal_id, (points.get(v.meal_id) ?? 0) + weight);
  });

  const totalVotes = votes?.length ?? 0;

  const ranked = (shortlist ?? [])
    .slice()
    .sort((a, b) => (points.get(b.meal_id) ?? 0) - (points.get(a.meal_id) ?? 0));

  const topThree = totalVotes > 0 ? ranked.slice(0, 3) : ranked;
  const rest = totalVotes > 0 ? ranked.slice(3) : [];

  // Cooking two dishes, so the shopping list covers whichever two meals are
  // currently ranked highest — recomputed on every load, since standing can
  // shift until voting closes.
  const topTwo = totalVotes > 0 ? ranked.slice(0, 2) : [];
  const topTwoMealIds = topTwo.map((e) => e.meal_id);

  const { data: ingredients } = topTwoMealIds.length
    ? await supabase
        .from("ingredients")
        .select("*")
        .in("meal_id", topTwoMealIds)
        .order("sort_order")
        .returns<Ingredient[]>()
    : { data: null };

  let checklistItems: ChecklistIngredient[] = [];

  if (ingredients?.length) {
    // Only whoever has shopping-list access seeds new rows — everyone else
    // can still read whatever's already there (RLS allows select for all).
    if (profile?.has_shopping_list_access) {
      await supabase.from("shopping_checklist_items").upsert(
        ingredients.map((ing) => ({
          voting_cycle_id: cycle.id,
          ingredient_id: ing.id,
          checked: false,
        })),
        { onConflict: "voting_cycle_id,ingredient_id", ignoreDuplicates: true },
      );
    }

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

  const canToggleChecklist =
    !!profile?.has_shopping_list_access && cycle.status === "closed";
  const checklistReadOnlyReason = !profile?.has_shopping_list_access
    ? "Only specific family members can tick these off."
    : cycle.status !== "closed"
      ? "Unlocks once voting closes — the top 2 may still change until then."
      : undefined;

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
          {totalVotes > 0 && (
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              Top 3
            </h2>
          )}
          <MealGrid
            entries={topThree}
            points={points}
            totalVotes={totalVotes}
            rankOffset={0}
          />

          {rest.length > 0 && (
            <>
              <hr className="my-6 border-neutral-200" />
              <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                Not currently in the top 3
              </h2>
              <MealGrid
                entries={rest}
                points={points}
                totalVotes={totalVotes}
                rankOffset={3}
                dimmed
              />
            </>
          )}

          {checklistItems.length > 0 && (
            <div className="mt-6">
              <ShoppingChecklist
                items={checklistItems}
                readOnly={!canToggleChecklist}
                readOnlyReason={checklistReadOnlyReason}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
