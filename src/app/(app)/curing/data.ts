"use client";

// Browser-side reads for Curing Projects, cached and re-synced by TanStack
// Query (see src/lib/client/providers.tsx). Same queries the server pages
// used to run, plus the optimistic cache patches the step buttons use so a
// tick shows up on tap rather than after the server answers.

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type {
  BakingProject,
  BakingProjectStep,
  BakingTemplate,
  BakingTemplateStep,
} from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";
import { addDuration } from "./date-utils";
import { expandSteps } from "./expand-steps";
import type { DueBakingStep } from "./get-due-steps";

export type ProjectRow = BakingProject & {
  steps: { completed_at: string | null }[];
};

export type TemplateRow = BakingTemplate & { steps: { count: number }[] };

export type ProjectDetail = {
  project: BakingProject | null;
  steps: BakingProjectStep[];
};

export type TemplateDetail = {
  template: BakingTemplate | null;
  steps: BakingTemplateStep[];
};

export const PROJECTS = ["curing-projects", "list"] as const;
export const projectKey = (id: string) => ["curing-project", id] as const;
export const TEMPLATES = ["curing-templates", "list"] as const;
export const templateKey = (id: string) => ["curing-templates", "detail", id] as const;
/** House Tasks' calendar copy of the steps (see house-tasks/data.ts). */
export const UPCOMING_STEPS = ["baking-steps", "upcoming"] as const;

/** Everything a step change can affect: this project, the list's "x/y done", the Tasks calendar. */
export function stepKeys(projectId: string) {
  return [projectKey(projectId), ["curing-projects"], ["baking-steps"]];
}

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS,
    queryFn: async () =>
      must(
        await sb()
          .from("baking_projects")
          .select("*, steps:baking_project_steps(completed_at)")
          .order("start_date", { ascending: false })
          .returns<ProjectRow[]>(),
      ) ?? [],
  });
}

export function useProject(id: string) {
  return useQuery<ProjectDetail>({
    queryKey: projectKey(id),
    queryFn: async () => {
      // maybeSingle so a deleted/unknown id renders "Not found" rather than
      // failing the query.
      const [project, steps] = await Promise.all([
        sb().from("baking_projects").select("*").eq("id", id).maybeSingle<BakingProject>(),
        sb()
          .from("baking_project_steps")
          .select("*")
          .eq("project_id", id)
          .order("due_date")
          .returns<BakingProjectStep[]>(),
      ]);
      return { project: must(project), steps: must(steps) ?? [] };
    },
  });
}

/** Also feeds the "start from a template" picker on the new-project form. */
export function useTemplates() {
  return useQuery({
    queryKey: TEMPLATES,
    queryFn: async () =>
      must(
        await sb()
          .from("baking_templates")
          .select("*, steps:baking_template_steps(count)")
          .order("name")
          .returns<TemplateRow[]>(),
      ) ?? [],
  });
}

export function useTemplate(id: string) {
  return useQuery<TemplateDetail>({
    queryKey: templateKey(id),
    queryFn: async () => {
      const [template, steps] = await Promise.all([
        sb().from("baking_templates").select("*").eq("id", id).maybeSingle<BakingTemplate>(),
        sb()
          .from("baking_template_steps")
          .select("*")
          .eq("template_id", id)
          .order("sort_order")
          .returns<BakingTemplateStep[]>(),
      ]);
      return { template: must(template), steps: must(steps) ?? [] };
    },
  });
}

// ---------------------------------------------------------------------------
// Optimistic twins of the step actions in [id]/actions.ts. They only need to
// be close enough to look right for the second or so until the re-sync lands.

let draftSeq = 0;
function draftId() {
  return `optimistic-${Date.now()}-${++draftSeq}`;
}

/** Rows added optimistically have no real id yet, so they can't be acted on. */
export function isDraftStep(id: string) {
  return id.startsWith("optimistic-");
}

function byDue<T extends { due_date: string; due_time: string | null }>(a: T, b: T) {
  return a.due_date.localeCompare(b.due_date);
}

function patchDetailSteps(
  qc: QueryClient,
  projectId: string,
  fn: (steps: BakingProjectStep[]) => BakingProjectStep[],
) {
  patch<ProjectDetail>(qc, projectKey(projectId), (d) => ({
    ...d,
    steps: fn(d.steps).slice().sort(byDue),
  }));
}

function draftProjectStep(
  projectId: string,
  s: {
    label: string;
    due_date: string;
    due_time: string | null;
    recurrence_interval_value?: number | null;
    recurrence_interval_unit?: BakingProjectStep["recurrence_interval_unit"];
    pending_chain?: BakingProjectStep["pending_chain"];
    sort_order?: number;
  },
): BakingProjectStep {
  return {
    id: draftId(),
    project_id: projectId,
    label: s.label,
    due_date: s.due_date,
    due_time: s.due_time,
    completed_at: null,
    weight: null,
    sort_order: s.sort_order ?? 0,
    recurrence_interval_value: s.recurrence_interval_value ?? null,
    recurrence_interval_unit: s.recurrence_interval_unit ?? null,
    pending_chain: s.pending_chain ?? null,
    created_at: new Date().toISOString(),
  };
}

/** toggleStepComplete: tick/untick, and release any steps it was holding back. */
export function toggleStepInCache(
  qc: QueryClient,
  projectId: string,
  stepId: string,
  completed: boolean,
) {
  const completedAt = completed ? new Date().toISOString() : null;
  patchDetailSteps(qc, projectId, (steps) => {
    const step = steps.find((s) => s.id === stepId);
    const released =
      completed && step?.pending_chain?.length
        ? // Stored chain rows carry no relative_to_previous flag; the server
          // action passes them through untyped, so the same falsy value here.
          expandSteps(
            step.due_date,
            step.due_time,
            step.pending_chain.map((s) => ({ ...s, relative_to_previous: false })),
          ).map((s) => draftProjectStep(projectId, s))
        : [];
    return [
      ...steps.map((s) =>
        s.id === stepId
          ? { ...s, completed_at: completedAt, pending_chain: released.length ? null : s.pending_chain }
          : s,
      ),
      ...released,
    ];
  });
  patch<DueBakingStep[]>(qc, UPCOMING_STEPS, (steps) =>
    steps.map((s) => (s.id === stepId ? { ...s, completed_at: completedAt } : s)),
  );
}

/** completeStepAndRepeat: tick this occurrence and add the next one. */
export function repeatStepInCache(qc: QueryClient, projectId: string, stepId: string) {
  const completedAt = new Date().toISOString();
  patchDetailSteps(qc, projectId, (steps) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step?.recurrence_interval_value) return steps;
    const unit = step.recurrence_interval_unit ?? "days";
    const next = addDuration(step.due_date, step.due_time, step.recurrence_interval_value, unit);
    return [
      ...steps.map((s) => (s.id === stepId ? { ...s, completed_at: completedAt } : s)),
      draftProjectStep(projectId, {
        label: step.label,
        ...next,
        recurrence_interval_value: step.recurrence_interval_value,
        recurrence_interval_unit: unit,
        pending_chain: step.pending_chain,
        sort_order: step.sort_order,
      }),
    ];
  });
  patch<DueBakingStep[]>(qc, UPCOMING_STEPS, (steps) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step?.recurrence_interval_value) return steps;
    // The calendar rows don't carry the unit; the detail cache (if loaded)
    // does, otherwise days is the action's own default.
    const detail = qc.getQueryData<ProjectDetail>(projectKey(projectId));
    const unit =
      detail?.steps.find((s) => s.id === stepId)?.recurrence_interval_unit ?? "days";
    const next = addDuration(step.due_date, step.due_time, step.recurrence_interval_value, unit);
    return [
      ...steps.map((s) => (s.id === stepId ? { ...s, completed_at: completedAt } : s)),
      { ...step, id: draftId(), completed_at: null, weight: null, ...next },
    ];
  });
}

export function deleteStepInCache(qc: QueryClient, projectId: string, stepId: string) {
  patchDetailSteps(qc, projectId, (steps) => steps.filter((s) => s.id !== stepId));
  patch<DueBakingStep[]>(qc, UPCOMING_STEPS, (steps) => steps.filter((s) => s.id !== stepId));
}

export function setStepWeightInCache(
  qc: QueryClient,
  projectId: string,
  stepId: string,
  weight: number | null,
) {
  patchDetailSteps(qc, projectId, (steps) =>
    steps.map((s) => (s.id === stepId ? { ...s, weight } : s)),
  );
  patch<DueBakingStep[]>(qc, UPCOMING_STEPS, (steps) =>
    steps.map((s) => (s.id === stepId ? { ...s, weight } : s)),
  );
}

export function setProjectWeightsInCache(
  qc: QueryClient,
  projectId: string,
  initialWeight: number | null,
  targetWeight: number | null,
) {
  const apply = <P extends BakingProject>(p: P): P =>
    p.id === projectId ? { ...p, initial_weight: initialWeight, target_weight: targetWeight } : p;
  patch<ProjectDetail>(qc, projectKey(projectId), (d) => ({
    ...d,
    project: d.project && apply(d.project),
  }));
  patch<ProjectRow[]>(qc, PROJECTS, (rows) => rows.map(apply));
}
