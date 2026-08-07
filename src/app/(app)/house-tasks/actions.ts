"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { Task } from "@/lib/types";
import { addInterval, toDateInputValue } from "./date-utils";

// Anyone can complete anyone's task — the completer earns the points, not
// necessarily the assignee. One-off tasks are marked done permanently;
// recurring tasks log the completion, then reset to pending (advancing the
// due date if one was set) for the next cycle.
export async function completeTask(taskId: string) {
  const { supabase, user } = await requireUser();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single<Task>();

  if (fetchError || !task) {
    throw new Error(fetchError?.message ?? "Task not found.");
  }

  const { error: insertError } = await supabase
    .from("task_completions")
    .insert({ task_id: task.id, completed_by: user.id, points: task.points });
  if (insertError) {
    throw new Error(insertError.message);
  }

  const isRecurring = !!task.recurrence_unit && !!task.recurrence_value;
  const update: {
    completed_at: string | null;
    due_date?: string | null;
    reminder_sent_at: null;
  } = {
    completed_at: isRecurring ? null : new Date().toISOString(),
    reminder_sent_at: null,
  };

  if (isRecurring && task.due_date) {
    update.due_date = toDateInputValue(
      addInterval(
        new Date(task.due_date),
        task.recurrence_unit!,
        task.recurrence_value!,
      ),
    );
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", taskId);
  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/house-tasks");
  revalidatePath("/house-tasks/completed");
  revalidatePath("/house-tasks/scoreboard");
}
