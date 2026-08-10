import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type DueBakingStep = {
  id: string;
  label: string;
  due_date: string;
  completed_at: string | null;
  weight: number | null;
  project: { id: string; name: string } | null;
};

// Used by House Tasks' Calendar view to show this week's Curing Projects
// milestones alongside regular tasks — kept here rather than in
// house-tasks/ since the query logic belongs with the app that owns the
// data.
export async function getUpcomingBakingSteps(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<DueBakingStep[]> {
  const { data } = await supabase
    .from("baking_project_steps")
    .select("id, label, due_date, completed_at, weight, project:baking_projects(id, name)")
    .gte("due_date", startDate)
    .lt("due_date", endDate)
    .returns<DueBakingStep[]>();

  return data ?? [];
}
