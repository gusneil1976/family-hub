"use server";

import { redirect } from "next/navigation";
import { requireBakingAccess } from "@/lib/auth";
import { addDays } from "../date-utils";

type ActionState = { error: string } | undefined;

export async function createProject(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireBakingAccess();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Project name is required." };
  }

  const startDate = String(formData.get("start_date") ?? "").trim();
  if (!startDate) {
    return { error: "Start date is required." };
  }

  const initialWeightRaw = String(formData.get("initial_weight") ?? "").trim();
  const initialWeight = initialWeightRaw ? Number(initialWeightRaw) : null;
  const targetWeightRaw = String(formData.get("target_weight") ?? "").trim();
  const targetWeight = targetWeightRaw ? Number(targetWeightRaw) : null;
  const templateId = String(formData.get("template_id") ?? "").trim() || null;

  const { data: project, error } = await supabase
    .from("baking_projects")
    .insert({
      name,
      template_id: templateId,
      start_date: startDate,
      initial_weight: initialWeight,
      target_weight: targetWeight,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !project) {
    return { error: error?.message ?? "Failed to create project." };
  }

  if (templateId) {
    const { data: templateSteps } = await supabase
      .from("baking_template_steps")
      .select("offset_days, label, sort_order, recurrence_interval_days, recurrence_count")
      .eq("template_id", templateId)
      .order("sort_order");

    if (templateSteps && templateSteps.length > 0) {
      const projectSteps: {
        project_id: string;
        label: string;
        due_date: string;
        sort_order: number;
        recurrence_interval_days?: number | null;
      }[] = [];

      for (const s of templateSteps) {
        if (!s.recurrence_interval_days) {
          projectSteps.push({
            project_id: project.id,
            label: s.label,
            due_date: addDays(startDate, s.offset_days),
            sort_order: s.sort_order,
          });
        } else if (s.recurrence_count) {
          for (let i = 0; i < s.recurrence_count; i++) {
            projectSteps.push({
              project_id: project.id,
              label:
                s.recurrence_count > 1
                  ? `${s.label} (${i + 1}/${s.recurrence_count})`
                  : s.label,
              due_date: addDays(
                startDate,
                s.offset_days + i * s.recurrence_interval_days,
              ),
              sort_order: s.sort_order,
            });
          }
        } else {
          // Indefinite recurrence: only the first occurrence is created now.
          // Completing it decides whether a next one gets scheduled.
          projectSteps.push({
            project_id: project.id,
            label: s.label,
            due_date: addDays(startDate, s.offset_days),
            sort_order: s.sort_order,
            recurrence_interval_days: s.recurrence_interval_days,
          });
        }
      }

      await supabase.from("baking_project_steps").insert(projectSteps);
    }
  }

  redirect(`/curing/${project.id}`);
}
