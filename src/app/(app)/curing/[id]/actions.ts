"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBakingAccess } from "@/lib/auth";
import type { DurationUnit } from "@/lib/types";
import { addDuration, daysBetween } from "../date-utils";
import { expandSteps } from "../expand-steps";

type ActionState = { error: string } | undefined;

const UNITS: DurationUnit[] = ["hours", "days", "weeks"];

export async function addStep(
  projectId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireBakingAccess();

  const label = String(formData.get("label") ?? "").trim();
  if (!label) {
    return { error: "Step label is required." };
  }
  const dueDate = String(formData.get("due_date") ?? "").trim();
  if (!dueDate) {
    return { error: "Due date is required." };
  }

  const intervalRaw = String(formData.get("recurrence_interval_value") ?? "").trim();
  const recurrenceIntervalValue = intervalRaw ? Number(intervalRaw) : null;
  if (
    recurrenceIntervalValue !== null &&
    (!Number.isFinite(recurrenceIntervalValue) || recurrenceIntervalValue <= 0)
  ) {
    return { error: "Repeat interval must be a positive number." };
  }
  const unitRaw = String(formData.get("recurrence_interval_unit") ?? "");
  const recurrenceIntervalUnit = recurrenceIntervalValue
    ? UNITS.includes(unitRaw as DurationUnit)
      ? (unitRaw as DurationUnit)
      : "days"
    : null;

  const { error } = await supabase.from("baking_project_steps").insert({
    project_id: projectId,
    label,
    due_date: dueDate,
    recurrence_interval_value: recurrenceIntervalValue,
    recurrence_interval_unit: recurrenceIntervalUnit,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/curing/${projectId}`);
}

export async function deleteStep(projectId: string, stepId: string) {
  const { supabase } = await requireBakingAccess();

  const { error } = await supabase
    .from("baking_project_steps")
    .delete()
    .eq("id", stepId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/curing/${projectId}`);
}

export async function toggleStepComplete(
  projectId: string,
  stepId: string,
  completed: boolean,
) {
  const { supabase } = await requireBakingAccess();

  if (completed) {
    // If this step was blocking a chain of "relative to previous" steps
    // (because it's an indefinite recurring step and its real end date
    // wasn't known until now), resolve and materialize that chain,
    // anchored at this step's actual due date/time.
    const { data: step } = await supabase
      .from("baking_project_steps")
      .select("due_date, due_time, pending_chain")
      .eq("id", stepId)
      .single();

    if (step?.pending_chain && step.pending_chain.length > 0) {
      const nextSteps = expandSteps(step.due_date, step.due_time, step.pending_chain);
      await supabase.from("baking_project_steps").insert(
        nextSteps.map((s) => ({
          project_id: projectId,
          label: s.label,
          due_date: s.due_date,
          due_time: s.due_time,
          recurrence_interval_value: s.recurrence_interval_value ?? null,
          recurrence_interval_unit: s.recurrence_interval_unit ?? null,
          pending_chain: s.pending_chain ?? null,
        })),
      );
      await supabase
        .from("baking_project_steps")
        .update({ pending_chain: null })
        .eq("id", stepId);
    }
  }

  const { error } = await supabase
    .from("baking_project_steps")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", stepId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/curing/${projectId}`);
  // Completing/reopening a step also changes what shows on the House Tasks
  // calendar's third (Curing) block.
  revalidatePath("/house-tasks");
}

// For an indefinite recurring step: complete this occurrence and schedule
// the next one recurrence_interval_value/unit later. No-ops if the step
// isn't actually a recurring one. pending_chain (whatever's deferred to run
// after this series eventually ends) carries forward unchanged, since the
// series hasn't ended yet.
export async function completeStepAndRepeat(projectId: string, stepId: string) {
  const { supabase } = await requireBakingAccess();

  const { data: step } = await supabase
    .from("baking_project_steps")
    .select(
      "label, due_date, due_time, recurrence_interval_value, recurrence_interval_unit, sort_order, pending_chain",
    )
    .eq("id", stepId)
    .single();

  if (!step?.recurrence_interval_value) {
    return;
  }

  const { error: completeError } = await supabase
    .from("baking_project_steps")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", stepId);
  if (completeError) {
    throw new Error(completeError.message);
  }

  const unit = step.recurrence_interval_unit ?? "days";
  const next = addDuration(step.due_date, step.due_time, step.recurrence_interval_value, unit);

  const { error: insertError } = await supabase.from("baking_project_steps").insert({
    project_id: projectId,
    label: step.label,
    due_date: next.due_date,
    due_time: next.due_time,
    recurrence_interval_value: step.recurrence_interval_value,
    recurrence_interval_unit: unit,
    sort_order: step.sort_order,
    pending_chain: step.pending_chain,
  });
  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath(`/curing/${projectId}`);
  revalidatePath("/house-tasks");
}

export async function setStepWeight(
  projectId: string,
  stepId: string,
  weight: number | null,
) {
  const { supabase } = await requireBakingAccess();

  const { error } = await supabase
    .from("baking_project_steps")
    .update({ weight })
    .eq("id", stepId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/curing/${projectId}`);
}

export async function setProjectWeights(
  projectId: string,
  initialWeight: number | null,
  targetWeight: number | null,
) {
  const { supabase } = await requireBakingAccess();

  const { error } = await supabase
    .from("baking_projects")
    .update({ initial_weight: initialWeight, target_weight: targetWeight })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/curing/${projectId}`);
}

// Recomputes each current step's offset from the project's start date and
// clones it into a brand-new template — completed_at/weight are
// instance-specific and deliberately excluded.
export async function saveAsTemplate(
  projectId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireBakingAccess();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Template name is required." };
  }

  const { data: project } = await supabase
    .from("baking_projects")
    .select("start_date")
    .eq("id", projectId)
    .single<{ start_date: string }>();

  if (!project) {
    return { error: "Project not found." };
  }

  const { data: steps } = await supabase
    .from("baking_project_steps")
    .select("label, due_date, sort_order")
    .eq("project_id", projectId)
    .order("sort_order");

  if (!steps || steps.length === 0) {
    return { error: "This project has no steps to save." };
  }

  const { data: template, error } = await supabase
    .from("baking_templates")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();

  if (error || !template) {
    return {
      error:
        error?.code === "23505"
          ? "A template with that name already exists."
          : (error?.message ?? "Failed to save template."),
    };
  }

  const { error: stepsError } = await supabase
    .from("baking_template_steps")
    .insert(
      steps.map((s, i) => ({
        template_id: template.id,
        offset_value: daysBetween(project.start_date, s.due_date),
        offset_unit: "days",
        relative_to_previous: false,
        label: s.label,
        sort_order: i,
      })),
    );

  if (stepsError) {
    return { error: stepsError.message };
  }

  redirect(`/curing/templates/${template.id}/edit`);
}
