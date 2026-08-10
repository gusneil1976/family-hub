"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { DiyTask } from "@/lib/types";

type ActionState = { error: string } | undefined;

function canManage(
  task: Pick<DiyTask, "created_by">,
  userId: string,
  profile: { is_admin: boolean } | null,
) {
  return task.created_by === userId || !!profile?.is_admin;
}

export async function updateDiyTask(
  taskId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user, profile } = await requireUser();

  const { data: task } = await supabase
    .from("diy_tasks")
    .select("created_by")
    .eq("id", taskId)
    .single<Pick<DiyTask, "created_by">>();

  if (!task) {
    return { error: "Task not found." };
  }
  if (!canManage(task, user.id, profile)) {
    return { error: "You can't edit this task." };
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

  const { error } = await supabase
    .from("diy_tasks")
    .update({ title, project, notes, hours_estimate: hoursEstimate })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  redirect("/diy-tasks");
}

export async function deleteDiyTask(taskId: string) {
  const { supabase, user, profile } = await requireUser();

  const { data: task } = await supabase
    .from("diy_tasks")
    .select("created_by")
    .eq("id", taskId)
    .single<Pick<DiyTask, "created_by">>();

  if (!task) {
    throw new Error("Task not found.");
  }
  if (!canManage(task, user.id, profile)) {
    throw new Error("You can't delete this task.");
  }

  const { error } = await supabase.from("diy_tasks").delete().eq("id", taskId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/diy-tasks");
}
