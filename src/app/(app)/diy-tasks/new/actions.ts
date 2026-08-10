"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function createDiyTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user, profile } = await requireUser();

  const performedBy = String(formData.get("performed_by") ?? "").trim();
  const createdBy = profile?.is_kiosk && performedBy ? performedBy : user.id;
  if (profile?.is_kiosk && !performedBy) {
    return { error: "Please select who's creating this." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Task is required." };
  }

  const project = String(formData.get("project") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const hoursRaw = String(formData.get("hours_estimate") ?? "").trim();
  const hoursEstimate = hoursRaw ? Number(hoursRaw) : null;
  if (hoursRaw && (!Number.isFinite(hoursEstimate) || hoursEstimate! < 0)) {
    return { error: "Estimated hours must be a positive number." };
  }

  const { error } = await supabase.from("diy_tasks").insert({
    title,
    project,
    notes,
    hours_estimate: hoursEstimate,
    created_by: createdBy,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/diy-tasks");
}
