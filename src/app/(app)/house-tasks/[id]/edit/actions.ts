"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { RecurrenceUnit, Task } from "@/lib/types";

type ActionState = { error: string } | undefined;

function canManage(
  task: Pick<Task, "created_by">,
  userId: string,
  profile: {
    is_admin: boolean;
    is_house_tasks_admin: boolean;
    is_kiosk: boolean;
  } | null,
) {
  return (
    task.created_by === userId ||
    !!profile?.is_admin ||
    !!profile?.is_house_tasks_admin ||
    !!profile?.is_kiosk
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
    .select("created_by, due_date, original_due_date")
    .eq("id", taskId)
    .single<Pick<Task, "created_by" | "due_date" | "original_due_date">>();

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
  const dueTime = String(formData.get("due_time") ?? "").trim() || null;
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
  const isTimeSensitive = formData.get("is_time_sensitive") === "on";

  // A deliberate due-date change here overrides whatever the roll-forward
  // cron had noted as the original date — this new date is the real one now.
  const dueDateChanged = dueDate !== task.due_date;

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description,
      assigned_to: assignedTo,
      due_date: dueDate,
      due_time: dueTime,
      original_due_date: dueDateChanged ? null : task.original_due_date,
      recurrence_unit: recurrenceUnit,
      recurrence_value: recurrenceValue,
      is_time_sensitive: isTimeSensitive,
      reminder_sent_at: null,
    })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  redirect("/house-tasks");
}

// Returns { error } instead of throwing on failure — a thrown Error's
// message gets stripped to an opaque digest once it crosses the Server
// Action boundary in a production build (this only shows up on the
// deployed site, never in local dev, which is why it's easy to miss).
// redirect() is exempt from that stripping (Next recognizes its digest
// specially), which is also why success redirects from here rather than
// leaving navigation to the caller — this page's own data (the task just
// deleted) no longer exists, so if Next re-rendered this route as part of
// the action response before the client could navigate away, its data
// fetch would 404 mid-flight.
export async function deleteTask(
  taskId: string,
): Promise<{ error: string } | undefined> {
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
    return { error: "You can't delete this task." };
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) {
    return {
      error: error.message.toLowerCase().includes("foreign key")
        ? "Can't delete — this task has completion history. Deactivate it instead."
        : error.message,
    };
  }

  revalidatePath("/house-tasks");
  redirect("/house-tasks");
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
