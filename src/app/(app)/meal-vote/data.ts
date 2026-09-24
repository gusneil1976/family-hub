"use client";

// Browser-side reads for Meal Vote, cached and re-synced by TanStack Query
// (see src/lib/client/providers.tsx). Same queries the server pages used to
// run, shared between pages wherever it's the same data — e.g. the landing
// page and the vote page both read the live cycle and "my votes".

import { keepPreviousData, useQuery, type QueryClient } from "@tanstack/react-query";
import type {
  Category,
  Ingredient,
  Meal,
  ShoppingChecklistItem,
  VotingCycle,
} from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";
import { ensureChecklistItems } from "./results/actions";

export type MealRow = Meal & { categories: { name: string } | null };
export type ShortlistRow = { id: string; meal_id: string; meals: Meal };
export type MyVote = { meal_id: string; rank: number };
export type CycleVote = {
  meal_id: string;
  rank: number;
  voter_id: string;
  voter: { display_name: string | null } | null;
};

// ---- Meals -----------------------------------------------------------------

export const MEALS = ["meals"] as const;

export function useMeals() {
  return useQuery({
    queryKey: MEALS,
    queryFn: async () =>
      must(
        await sb()
          .from("meals")
          .select("*, categories(name)")
          .order("name")
          .returns<MealRow[]>(),
      ) ?? [],
  });
}

/** One meal (with its category name), or null if it doesn't exist / was deleted. */
export function useMeal(id: string) {
  return useQuery({
    queryKey: ["meal", id],
    queryFn: async () =>
      must(
        await sb()
          .from("meals")
          .select("*, categories(name)")
          .eq("id", id)
          .maybeSingle<MealRow>(),
      ),
  });
}

export function useMealIngredients(mealId: string) {
  return useQuery({
    queryKey: ["ingredients", mealId],
    queryFn: async () =>
      must(
        await sb()
          .from("ingredients")
          .select("*")
          .eq("meal_id", mealId)
          .order("sort_order")
          .returns<Ingredient[]>(),
      ) ?? [],
  });
}

export const MEAL_CATEGORIES = ["meal-categories"] as const;

export function useMealCategories(enabled = true) {
  return useQuery({
    queryKey: MEAL_CATEGORIES,
    enabled,
    queryFn: async () =>
      must(
        await sb()
          .from("categories")
          .select("*")
          .order("name")
          .returns<Category[]>(),
      ) ?? [],
  });
}

/** Optimistic twin of setWeeklyMeal: flips the flag in the list and on the meal's own page. */
export function setWeeklyMealInCache(qc: QueryClient, mealId: string, isWeekly: boolean) {
  patch<MealRow[]>(qc, MEALS, (meals) =>
    meals.map((m) => (m.id === mealId ? { ...m, is_weekly_meal: isWeekly } : m)),
  );
  patch<MealRow | null>(qc, ["meal", mealId], (m) =>
    m ? { ...m, is_weekly_meal: isWeekly } : m,
  );
}

// ---- Voting cycles -----------------------------------------------------------

/** The cycle currently open for votes (landing page + vote page). */
export function useLiveCycle() {
  return useQuery({
    queryKey: ["voting-cycle", "live"],
    queryFn: async () =>
      must(
        await sb()
          .from("voting_cycles")
          .select("*")
          .eq("status", "live")
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle<VotingCycle>(),
      ),
  });
}

/** The most recent live-or-closed cycle — what the results page reports on. */
export const RESULTS_CYCLE = ["voting-cycle", "results"] as const;

export function useResultsCycle() {
  return useQuery({
    queryKey: RESULTS_CYCLE,
    queryFn: async () =>
      must(
        await sb()
          .from("voting_cycles")
          .select("*")
          .in("status", ["live", "closed"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<VotingCycle>(),
      ),
  });
}

/** The draft-or-live cycle the admin shortlist screen manages. */
export function useActiveCycle(enabled = true) {
  return useQuery({
    queryKey: ["voting-cycle", "active"],
    enabled,
    queryFn: async () =>
      must(
        await sb()
          .from("voting_cycles")
          .select("*")
          .in("status", ["draft", "live"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<VotingCycle>(),
      ),
  });
}

// ---- Shortlist & votes -------------------------------------------------------

export function useShortlist(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["shortlist", cycleId],
    enabled: !!cycleId,
    queryFn: async () =>
      must(
        await sb()
          .from("shortlist_entries")
          .select("id, meal_id, meals(*)")
          .eq("voting_cycle_id", cycleId!)
          .returns<ShortlistRow[]>(),
      ) ?? [],
  });
}

/** The signed-in person's own ranked picks for a cycle. */
export function useMyVotes(cycleId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["votes", "mine", cycleId],
    enabled: !!cycleId && !!userId,
    queryFn: async () =>
      must(
        await sb()
          .from("votes")
          .select("meal_id, rank")
          .eq("voting_cycle_id", cycleId!)
          .eq("voter_id", userId!)
          .order("rank", { ascending: true })
          .returns<MyVote[]>(),
      ) ?? [],
  });
}

/** Every vote in a cycle, with who cast it — for the standings. */
export function useCycleVotes(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["votes", "cycle", cycleId],
    enabled: !!cycleId,
    queryFn: async () =>
      must(
        await sb()
          .from("votes")
          .select("meal_id, rank, voter_id, voter:profiles(display_name)")
          .eq("voting_cycle_id", cycleId!)
          .returns<CycleVote[]>(),
      ) ?? [],
  });
}

/**
 * Optimistic twin of submitVotes: replaces one voter's picks in the cycle's
 * standings (and in "my votes" when it's the signed-in person voting).
 */
export function replaceVotesInCache(
  qc: QueryClient,
  cycleId: string,
  voter: { id: string; name: string | null; isMe: boolean },
  mealIds: string[],
) {
  const picks = mealIds.map((meal_id, i) => ({ meal_id, rank: i + 1 }));
  patch<CycleVote[]>(qc, ["votes", "cycle", cycleId], (votes) => [
    ...votes.filter((v) => v.voter_id !== voter.id),
    ...picks.map((p) => ({
      ...p,
      voter_id: voter.id,
      voter: { display_name: voter.name },
    })),
  ]);
  if (voter.isMe) {
    qc.setQueryData<MyVote[]>(["votes", "mine", cycleId], picks);
  }
}

/** Query keys every vote change should re-sync. */
export const VOTE_KEYS = [["votes"]] as const;

/** Query keys every shortlist / cycle change should re-sync. */
export const SHORTLIST_KEYS = [["voting-cycle"], ["shortlist"], ["votes"], ["checklist"]] as const;

// ---- Shopping checklist ------------------------------------------------------

export type ChecklistData = {
  ingredients: Ingredient[];
  items: ShoppingChecklistItem[];
};

export function checklistKey(cycleId: string, mealIds: string[]) {
  return ["checklist", cycleId, mealIds.join(",")] as const;
}

/**
 * Ingredients of the current top-N meals plus their tick-off rows. Whoever
 * has shopping-list access seeds any missing rows first (a server action, so
 * the write stays on the server) — everyone else just reads what's there.
 */
export function useChecklist(
  cycleId: string | undefined,
  mealIds: string[],
  canSeed: boolean,
) {
  return useQuery({
    queryKey: checklistKey(cycleId ?? "", mealIds),
    enabled: !!cycleId && mealIds.length > 0,
    // When the top N shifts (a vote comes in, the admin changes the count)
    // keep showing the old list while the new one loads, rather than
    // flashing the whole page back to a skeleton.
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ChecklistData> => {
      const ingredients =
        must(
          await sb()
            .from("ingredients")
            .select("*")
            .in("meal_id", mealIds)
            .order("sort_order")
            .returns<Ingredient[]>(),
        ) ?? [];
      if (!ingredients.length) return { ingredients, items: [] };

      if (canSeed) {
        await ensureChecklistItems(
          cycleId!,
          ingredients.map((i) => i.id),
        );
      }

      const items =
        must(
          await sb()
            .from("shopping_checklist_items")
            .select("*")
            .eq("voting_cycle_id", cycleId!)
            .returns<ShoppingChecklistItem[]>(),
        ) ?? [];
      return { ingredients, items };
    },
  });
}
