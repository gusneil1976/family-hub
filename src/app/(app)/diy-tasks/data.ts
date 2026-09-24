"use client";

// Browser-side reads for DIY Tasks, cached and re-synced by TanStack Query
// (see src/lib/client/providers.tsx). Same query the server page used to run;
// the edit page and the project suggestions are served from it too.

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { DiyTask } from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";

export const DIY_TASKS = ["diy-tasks"] as const;

/** Query key prefixes every DIY task change should re-sync. */
export const DIY_KEYS = [["diy-tasks"]] as const;

export function useDiyTasks() {
  return useQuery({
    queryKey: DIY_TASKS,
    queryFn: async () =>
      must(
        await sb()
          .from("diy_tasks")
          .select("*")
          .order("created_at", { ascending: false })
          .returns<DiyTask[]>(),
      ) ?? [],
  });
}

/** Distinct projects already used, alphabetically — the form's suggestions. */
export function projectOptionsFrom(tasks: DiyTask[]) {
  return Array.from(
    new Set(tasks.map((t) => t.project).filter((p): p is string => !!p)),
  ).sort((a, b) => a.localeCompare(b));
}

export function patchDiyTask(
  qc: QueryClient,
  taskId: string,
  fn: (task: DiyTask) => DiyTask,
) {
  patch<DiyTask[]>(qc, DIY_TASKS, (tasks) =>
    tasks.map((t) => (t.id === taskId ? fn(t) : t)),
  );
}

export function removeDiyTask(qc: QueryClient, taskId: string) {
  patch<DiyTask[]>(qc, DIY_TASKS, (tasks) => tasks.filter((t) => t.id !== taskId));
}
