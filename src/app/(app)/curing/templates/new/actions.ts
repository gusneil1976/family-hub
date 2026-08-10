"use server";

import { redirect } from "next/navigation";
import { requireBakingAccess } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function createTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireBakingAccess();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Template name is required." };
  }

  const offsets = formData.getAll("offset_days").map(String);
  const labels = formData.getAll("label").map(String);
  const recurrenceIntervals = formData.getAll("recurrence_interval_days").map(String);
  const recurrenceCounts = formData.getAll("recurrence_count").map(String);
  const steps: {
    offset_days: number;
    label: string;
    recurrence_interval_days: number | null;
    recurrence_count: number | null;
  }[] = [];
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i].trim();
    if (!label) continue;
    const offsetDays = Number(offsets[i]);
    if (!Number.isFinite(offsetDays)) {
      return { error: `"${label}" needs a valid day number.` };
    }
    const intervalRaw = recurrenceIntervals[i]?.trim();
    const interval = intervalRaw ? Number(intervalRaw) : null;
    if (interval !== null && (!Number.isFinite(interval) || interval <= 0)) {
      return { error: `"${label}" has an invalid repeat interval.` };
    }
    const countRaw = recurrenceCounts[i]?.trim();
    const count = interval && countRaw ? Number(countRaw) : null;
    if (count !== null && (!Number.isFinite(count) || count <= 0)) {
      return { error: `"${label}" has an invalid repeat count.` };
    }
    steps.push({
      offset_days: offsetDays,
      label,
      recurrence_interval_days: interval,
      recurrence_count: count,
    });
  }
  if (steps.length === 0) {
    return { error: "Add at least one step." };
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
          : (error?.message ?? "Failed to create template."),
    };
  }

  const { error: stepsError } = await supabase.from("baking_template_steps").insert(
    steps.map((s, i) => ({
      template_id: template.id,
      offset_days: s.offset_days,
      label: s.label,
      sort_order: i,
      recurrence_interval_days: s.recurrence_interval_days,
      recurrence_count: s.recurrence_count,
    })),
  );

  if (stepsError) {
    return { error: stepsError.message };
  }

  redirect("/curing/templates");
}
