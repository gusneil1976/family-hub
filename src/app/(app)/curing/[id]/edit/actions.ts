"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBakingAccess } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function updateProject(
  projectId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireBakingAccess();

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

  const { error } = await supabase
    .from("baking_projects")
    .update({
      name,
      start_date: startDate,
      initial_weight: initialWeight,
      target_weight: targetWeight,
    })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  redirect(`/curing/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const { supabase } = await requireBakingAccess();

  const { error } = await supabase
    .from("baking_projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/curing");
  revalidatePath("/house-tasks");
}
