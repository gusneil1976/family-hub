"use client";

// Browser-side reads for House Tasks, cached and re-synced by TanStack Query
// (see src/lib/client/providers.tsx). Same queries the server pages used to run.

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { Profile, Task } from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";
import { getUpcomingBakingSteps, type DueBakingStep } from "../curing/get-due-steps";
import { addInterval, toDateInputValue } from "./date-utils";

export type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

export const OPEN_TASKS = ["tasks", "open"] as const;

export function useOpenTasks() {
  return useQuery({
    queryKey: OPEN_TASKS,
    queryFn: async () =>
      must(
        await sb()
          .from("tasks")
          .select("*, assignee:profiles!tasks_assigned_to_fkey(display_name)")
          .eq("is_active", true)
          .is("completed_at", null)
          .order("due_date", { ascending: true, nullsFirst: false })
          .returns<TaskRow[]>(),
      ) ?? [],
  });
}

/** Everyone who can be picked as "who did this" / assignee (not kiosk, not archived). */
export function useFamily(enabled = true) {
  return useQuery({
    queryKey: ["profiles", "family"],
    enabled,
    queryFn: async () =>
      must(
        await sb()
          .from("profiles")
          .select("*")
          .eq("is_archived", false)
          .eq("is_kiosk", false)
          .order("display_name")
          .returns<Profile[]>(),
      ) ?? [],
  });
}

// Generously wide window, not week-precise — the calendar buckets by local
// date client-side anyway. Only fetched for whoever has Curing Projects access.
export function useUpcomingBakingSteps(enabled: boolean) {
  return useQuery<DueBakingStep[]>({
    queryKey: ["baking-steps", "upcoming"],
    enabled,
    queryFn: () => {
      const start = new Date();
      start.setDate(start.getDate() - 14);
      const end = new Date();
      end.setDate(end.getDate() + 90);
      return getUpcomingBakingSteps(sb(), toDateInputValue(start), toDateInputValue(end));
    },
  });
}

/**
 * Optimistic twin of what completeTask / markNotCompleted(close) do to the
 * task itself: one-offs disappear from the open list, recurring ones move on
 * to their next due date.
 */
export function closeOutTaskInCache(qc: QueryClient, taskId: string) {
  patch<TaskRow[]>(qc, OPEN_TASKS, (tasks) =>
    tasks.flatMap((t) => {
      if (t.id !== taskId) return [t];
      if (!t.recurrence_unit || !t.recurrence_value) return [];
      if (!t.due_date) return [t];
      // Date-only arithmetic in UTC, as on the server, so a clock change in
      // the browser's timezone can't nudge the result onto a different day.
      const next = addInterval(
        new Date(`${t.due_date.slice(0, 10)}T12:00:00Z`),
        t.recurrence_unit,
        t.recurrence_value,
      );
      return [{ ...t, original_due_date: null, due_date: next.toISOString().slice(0, 10) }];
    }),
  );
}

/** A placeholder row for a task that's been typed but not saved yet. */
export function draftTask(title: string, userId: string, assigneeName: string | null): TaskRow {
  return {
    id: `optimistic-${Date.now()}`,
    title,
    description: null,
    points: 0,
    points_approved: true,
    created_by: userId,
    assigned_to: userId,
    due_date: null,
    due_time: null,
    original_due_date: null,
    recurrence_unit: null,
    recurrence_value: null,
    is_active: true,
    completed_at: null,
    reminder_sent_at: null,
    is_time_sensitive: false,
    created_at: new Date().toISOString(),
    assignee: { display_name: assigneeName },
  };
}

/** Query keys every task change should re-sync. */
export const TASK_KEYS = [["tasks"], ["completions"]] as const;

// ---------------------------------------------------------------------------
// Completed / Scoreboard / Edit / Approvals screens. Keys start with
// "completions" or "tasks" so TASK_KEYS re-syncs them after any task change.

export type CompletionRow = {
  id: string;
  points: number;
  closed_task: boolean;
  completed_at: string;
  tasks: { title: string } | null;
  profiles: { display_name: string | null } | null;
};

/** Everything logged (completed or not-completed) since `monthStart`, newest first. */
export function useMonthCompletions(monthStart: Date) {
  const since = monthStart.toISOString();
  return useQuery({
    queryKey: ["completions", "month", since],
    queryFn: async () =>
      must(
        await sb()
          .from("task_completions")
          .select(
            "id, points, closed_task, completed_at, tasks(title), profiles(display_name)",
          )
          .gte("completed_at", since)
          .order("completed_at", { ascending: false })
          .returns<CompletionRow[]>(),
      ) ?? [],
  });
}

/** Optimistic twin of uncompleteTask for the Completed list: the entry goes at once. */
export function removeCompletionInCache(qc: QueryClient, completionId: string) {
  qc.setQueriesData<CompletionRow[]>({ queryKey: ["completions", "month"] }, (rows) =>
    rows?.filter((c) => c.id !== completionId),
  );
}

export type ScoreRow = {
  points: number;
  completed_by: string;
  completed_at: string;
};

// Only completions of approved tasks count — filtered via an inner join
// so a task's points_approved flag is evaluated live, retroactively
// counting completions logged while it was still pending.
export function useScoreboardCompletions(since: Date) {
  const from = since.toISOString();
  return useQuery({
    queryKey: ["completions", "scoreboard", from],
    queryFn: async () =>
      must(
        await sb()
          .from("task_completions")
          .select("points, completed_by, completed_at, tasks!inner(points_approved)")
          .eq("tasks.points_approved", true)
          .gte("completed_at", from)
          .returns<ScoreRow[]>(),
      ) ?? [],
  });
}

/** One task for the edit screen; null once it's gone (deleted / not visible). */
export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", "one", id],
    queryFn: async () =>
      must(await sb().from("tasks").select("*").eq("id", id).maybeSingle<Task>()),
  });
}

export type ApprovalRow = Task & { creator: { display_name: string | null } | null };

export const APPROVAL_TASKS = ["tasks", "approvals"] as const;

/** Tasks whose points are waiting on a house-tasks admin. */
export function usePendingApprovals(enabled = true) {
  return useQuery({
    queryKey: APPROVAL_TASKS,
    enabled,
    queryFn: async () =>
      must(
        await sb()
          .from("tasks")
          .select("*, creator:profiles!tasks_created_by_fkey(display_name)")
          .eq("points_approved", false)
          .order("created_at")
          .returns<ApprovalRow[]>(),
      ) ?? [],
  });
}
