"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { Task, TaskCompletion } from "@/lib/types";
import { addInterval, toDateInputValue } from "./date-utils";

// Anyone can complete anyone's task — the completer earns the points, not
// necessarily the assignee. One-off tasks are marked done permanently;
// recurring tasks log the completion, then reset to pending (advancing the
// due date if one was set) for the next cycle. On kiosk, performedBy names
// who actually did it (the shared kiosk login has no points of its own);
// only honored when the caller's own profile is actually kiosk.
export async function completeTask(taskId: string, performedBy?: string) {
  const { supabase, user, profile } = await requireUser();
  const completedBy = profile?.is_kiosk && performedBy ? performedBy : user.id;

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
    .insert({ task_id: task.id, completed_by: completedBy, points: task.points });
  if (insertError) {
    throw new Error(insertError.message);
  }

  const isRecurring = !!task.recurrence_unit && !!task.recurrence_value;
  const update: {
    completed_at: string | null;
    due_date?: string | null;
    original_due_date: null;
    reminder_sent_at: null;
  } = {
    completed_at: isRecurring ? null : new Date().toISOString(),
    // Clears whatever the roll-forward cron may have set — this task is
    // moving on to a fresh cycle (or is done), not sitting overdue anymore.
    original_due_date: null,
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

// Deducts a task's points from whoever it's assigned to. Unlike
// completeTask, this always debits the assignee specifically, not whoever
// clicks the button, so there's no "who" picker even on kiosk.
//
// `close` chooses what happens to the task itself: false (leave open)
// keeps it exactly as it was — same due date, still pending, in case
// someone else can still get to it today. true (close it out) treats the
// moment as passed, same as the time-sensitive auto-miss cron
// (src/app/api/cron/task-reminders/route.ts): a recurring task advances
// to its next occurrence from its own due date, a one-off is marked done.
export async function markNotCompleted(taskId: string, close: boolean) {
  const { supabase } = await requireUser();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single<Task>();

  if (fetchError || !task) {
    throw new Error(fetchError?.message ?? "Task not found.");
  }

  const { error } = await supabase.from("task_completions").insert({
    task_id: task.id,
    completed_by: task.assigned_to,
    points: -task.points,
    closed_task: close,
  });
  if (error) {
    throw new Error(error.message);
  }

  if (close) {
    const isRecurring = !!task.recurrence_unit && !!task.recurrence_value;
    const update: {
      completed_at: string | null;
      due_date?: string | null;
      original_due_date: null;
      reminder_sent_at: null;
    } = {
      completed_at: isRecurring ? null : new Date().toISOString(),
      original_due_date: null,
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
  }

  revalidatePath("/house-tasks");
  revalidatePath("/house-tasks/completed");
  revalidatePath("/house-tasks/scoreboard");
}

// Removes a logged completion (and its points). If it's the task's most
// recent completion, also unwinds the state change completeTask (or a
// markNotCompleted with close=true) made — clears completed_at for a
// one-off task, or rolls a recurring task's due_date back by one interval —
// so it lands exactly where it was right before that entry. An older,
// superseded entry just gets deleted from the history/points ledger, since
// the task's current state has already moved on and can't be safely
// rewound past later completions. A markNotCompleted left open
// (closed_task false, negative points) never touched the task's state to
// begin with, so it's always just a plain delete.
export async function uncompleteTask(completionId: string) {
  const { supabase } = await requireUser();

  const { data: completion, error: fetchError } = await supabase
    .from("task_completions")
    .select("*")
    .eq("id", completionId)
    .single<TaskCompletion>();

  if (fetchError || !completion) {
    throw new Error(fetchError?.message ?? "Completion not found.");
  }

  const { data: laterCompletions } = await supabase
    .from("task_completions")
    .select("id")
    .eq("task_id", completion.task_id)
    .gt("completed_at", completion.completed_at);

  const isLatest = !laterCompletions || laterCompletions.length === 0;

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", completion.task_id)
    .single<Task>();

  const { error: deleteError } = await supabase
    .from("task_completions")
    .delete()
    .eq("id", completionId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (task && isLatest && (completion.points >= 0 || completion.closed_task)) {
    const isRecurring = !!task.recurrence_unit && !!task.recurrence_value;
    if (isRecurring) {
      if (task.due_date) {
        const due_date = toDateInputValue(
          addInterval(
            new Date(task.due_date),
            task.recurrence_unit!,
            -task.recurrence_value!,
          ),
        );
        await supabase.from("tasks").update({ due_date }).eq("id", task.id);
      }
    } else {
      await supabase
        .from("tasks")
        .update({ completed_at: null })
        .eq("id", task.id);
    }
  }

  revalidatePath("/house-tasks");
  revalidatePath("/house-tasks/completed");
  revalidatePath("/house-tasks/scoreboard");
}
