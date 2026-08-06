"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { RecurrenceUnit, Task } from "@/lib/types";

type ActionState = { error: string } | undefined;

function canManage(
  task: Pick<Task, "created_by">,
  userId: string,
  profile: { is_admin: boolean; is_house_tasks_admin: boolean } | null,
) {
  return (
    task.created_by === userId ||
    !!profile?.is_admin ||
    !!profile?.is_house_tasks_admin
  );
}

export async function updateTask(
  taskId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user, profile } = await requireUser();

  const { data: task } = await supabase
    .from("tasks")
    .select("created_by")
    .eq("id", taskId)
    .single<Pick<Task, "created_by">>();

  if (!task) {
    return { error: "Task not found." };
  }
  if (!canManage(task, user.id, profile)) {
    return { error: "You can't edit this task." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const assignedTo =
    String(formData.get("assigned_to") ?? "").trim() || user.id;
  const dueDate = String(formData.get("due_date") ?? "").trim() || null;
  const description =
    String(formData.get("description") ?? "").trim() || null;

  const recurrenceUnitRaw = String(formData.get("recurrence_unit") ?? "");
  const recurrenceUnit: RecurrenceUnit | null =
    recurrenceUnitRaw === "days" ||
    recurrenceUnitRaw === "weeks" ||
    recurrenceUnitRaw === "months"
      ? recurrenceUnitRaw
      : null;
  const recurrenceValueRaw = formData.get("recurrence_value");
  const recurrenceValue =
    recurrenceUnit && recurrenceValueRaw ? Number(recurrenceValueRaw) : null;

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description,
      assigned_to: assignedTo,
      due_date: dueDate,
      recurrence_unit: recurrenceUnit,
      recurrence_value: recurrenceValue,
    })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  redirect("/house-tasks");
}

export async function deleteTask(taskId: string) {
  const { supabase, user, profile } = await requireUser();

  const { data: task } = await supabase
    .from("tasks")
    .select("created_by")
    .eq("id", taskId)
    .single<Pick<Task, "created_by">>();

  if (!task) {
    throw new Error("Task not found.");
  }
  if (!canManage(task, user.id, profile)) {
    throw new Error("You can't delete this task.");
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("foreign key")
        ? "Can't delete — this task has completion history. Deactivate it instead."
        : error.message,
    );
  }

  revalidatePath("/house-tasks");
}

export async function setTaskActive(taskId: string, active: boolean) {
  const { supabase, user, profile } = await requireUser();

  const { data: task } = await supabase
    .from("tasks")
    .select("created_by")
    .eq("id", taskId)
    .single<Pick<Task, "created_by">>();

  if (!task) {
    throw new Error("Task not found.");
  }
  if (!canManage(task, user.id, profile)) {
    throw new Error("You can't edit this task.");
  }

  const { error } = await supabase
    .from("tasks")
    .update({ is_active: active })
    .eq("id", taskId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/house-tasks");
  revalidatePath(`/house-tasks/${taskId}/edit`);
}
