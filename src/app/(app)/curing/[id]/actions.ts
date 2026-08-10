"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBakingAccess } from "@/lib/auth";
import { daysBetween } from "../date-utils";

type ActionState = { error: string } | undefined;

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

  const { error } = await supabase.from("baking_project_steps").insert({
    project_id: projectId,
    label,
    due_date: dueDate,
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
        offset_days: daysBetween(project.start_date, s.due_date),
        label: s.label,
        sort_order: i,
      })),
    );

  if (stepsError) {
    return { error: stepsError.message };
  }

  redirect(`/curing/templates/${template.id}/edit`);
}
