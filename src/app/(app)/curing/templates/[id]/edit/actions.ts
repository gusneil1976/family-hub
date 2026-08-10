"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBakingAccess } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function updateTemplate(
  templateId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireBakingAccess();

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

  const { error: nameError } = await supabase
    .from("baking_templates")
    .update({ name })
    .eq("id", templateId);

  if (nameError) {
    return {
      error:
        nameError.code === "23505"
          ? "A template with that name already exists."
          : nameError.message,
    };
  }

  // Simplest correct approach: replace all step rows on save, same pattern
  // as meal ingredient edits, rather than diffing which changed.
  const { error: deleteError } = await supabase
    .from("baking_template_steps")
    .delete()
    .eq("template_id", templateId);
  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: insertError } = await supabase
    .from("baking_template_steps")
    .insert(
      steps.map((s, i) => ({
        template_id: templateId,
        offset_days: s.offset_days,
        label: s.label,
        sort_order: i,
        recurrence_interval_days: s.recurrence_interval_days,
        recurrence_count: s.recurrence_count,
      })),
    );
  if (insertError) {
    return { error: insertError.message };
  }

  redirect("/curing/templates");
}

export async function deleteTemplate(templateId: string) {
  const { supabase } = await requireBakingAccess();

  const { error } = await supabase
    .from("baking_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/curing/templates");
}
