"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";
import type { VotingCycle } from "@/lib/types";
import { SHORTLIST_SIZE } from "./constants";

type ActionState = { error: string } | undefined;

async function getActiveCycle(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("voting_cycles")
    .select("*")
    .in("status", ["draft", "live"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<VotingCycle>();
  return data;
}

export async function generateShortlist(
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();

  let cycle = await getActiveCycle(supabase);

  if (cycle?.status === "live") {
    return {
      error:
        "Voting is already live for this cycle. Close it before starting a new shortlist.",
    };
  }

  if (!cycle) {
    const { data: newCycle, error } = await supabase
      .from("voting_cycles")
      .insert({ status: "draft", created_by: user.id })
      .select("*")
      .single<VotingCycle>();
    if (error || !newCycle) {
      return { error: error?.message ?? "Failed to start a new cycle." };
    }
    cycle = newCycle;
  }

  const { data: eligibleMeals, error: mealsError } = await supabase
    .from("meals")
    .select("id")
    .eq("is_weekly_meal", true);

  if (mealsError) {
    return { error: mealsError.message };
  }
  if (!eligibleMeals || eligibleMeals.length === 0) {
    return {
      error:
        "No meals are flagged as weekly meals yet. Tick some from the meal library first.",
    };
  }

  const picked = [...eligibleMeals]
    .sort(() => Math.random() - 0.5)
    .slice(0, SHORTLIST_SIZE);

  const { error: deleteError } = await supabase
    .from("shortlist_entries")
    .delete()
    .eq("voting_cycle_id", cycle.id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: insertError } = await supabase
    .from("shortlist_entries")
    .insert(picked.map((m) => ({ voting_cycle_id: cycle!.id, meal_id: m.id })));
  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/meal-vote/admin/shortlist");
}

export async function removeShortlistEntry(entryId: string) {
  const { supabase } = await requireAdmin();

  const { data: entry } = await supabase
    .from("shortlist_entries")
    .select("voting_cycle_id, voting_cycles(status)")
    .eq("id", entryId)
    .single<{ voting_cycle_id: string; voting_cycles: { status: string } }>();

  if (!entry || entry.voting_cycles.status !== "draft") {
    throw new Error("Can only remove entries from a draft shortlist.");
  }

  const { error } = await supabase
    .from("shortlist_entries")
    .delete()
    .eq("id", entryId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/meal-vote/admin/shortlist");
}

export async function topUpShortlist(
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const cycle = await getActiveCycle(supabase);

  if (!cycle || cycle.status !== "draft") {
    return { error: "No draft shortlist to top up." };
  }

  const { data: currentEntries, error: currentError } = await supabase
    .from("shortlist_entries")
    .select("meal_id")
    .eq("voting_cycle_id", cycle.id);
  if (currentError) {
    return { error: currentError.message };
  }

  const currentIds = new Set((currentEntries ?? []).map((e) => e.meal_id));
  const needed = SHORTLIST_SIZE - currentIds.size;
  if (needed <= 0) {
    return { error: `Shortlist already has ${currentIds.size} meals.` };
  }

  const { data: eligibleMeals, error: mealsError } = await supabase
    .from("meals")
    .select("id")
    .eq("is_weekly_meal", true);
  if (mealsError) {
    return { error: mealsError.message };
  }

  const available = (eligibleMeals ?? []).filter((m) => !currentIds.has(m.id));
  if (available.length === 0) {
    return { error: "No additional weekly meals to add." };
  }

  const picked = [...available]
    .sort(() => Math.random() - 0.5)
    .slice(0, needed);

  const { error: insertError } = await supabase
    .from("shortlist_entries")
    .insert(picked.map((m) => ({ voting_cycle_id: cycle.id, meal_id: m.id })));
  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/meal-vote/admin/shortlist");
}

export async function publishShortlist(
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const cycle = await getActiveCycle(supabase);

  if (!cycle || cycle.status !== "draft") {
    return { error: "No draft shortlist to publish." };
  }

  const { error } = await supabase
    .from("voting_cycles")
    .update({ status: "live", published_at: new Date().toISOString() })
    .eq("id", cycle.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/meal-vote/admin/shortlist");
  revalidatePath("/meal-vote/vote");
  revalidatePath("/meal-vote");
}

export async function closeVoting(
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const cycle = await getActiveCycle(supabase);

  if (!cycle || cycle.status !== "live") {
    return { error: "No live voting to close." };
  }

  const { error } = await supabase
    .from("voting_cycles")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", cycle.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/meal-vote/admin/shortlist");
  revalidatePath("/meal-vote/results");
  revalidatePath("/meal-vote");
}
