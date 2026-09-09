"use client";

import { useActionState, useOptimistic } from "react";
import type { Task } from "@/lib/types";
import type { DueBakingStep } from "../curing/get-due-steps";
import { createTask } from "./new/actions";
import { QuickAddTask } from "./quick-add-task";
import { TaskBoard } from "./task-board";

type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

// Owns the quick-add box together with the list it feeds, so a submitted
// task can appear in "My tasks" the instant it's typed — via useOptimistic
// — rather than waiting on createTask's real round trip (insert, then a
// full page reload) to finish before anything visible happens. The
// optimistic row is swapped for the real one automatically once that
// reload lands, since useOptimistic resets to the fresh `myTasks` prop as
// soon as the server re-render arrives. `children` (StatTileRow) is
// rendered between the box and the board to keep the page's visual order
// without needing its own optimistic wiring — a passing miscount there for
// a second or two is harmless.
export function TasksWithQuickAdd({
  myTasks,
  otherTasks,
  editableTaskIds,
  bakingSteps,
  currentUserId,
  children,
}: {
  myTasks: TaskRow[];
  otherTasks: TaskRow[];
  editableTaskIds: string[];
  bakingSteps?: DueBakingStep[];
  currentUserId: string;
  children?: React.ReactNode;
}) {
  const [optimisticMyTasks, addOptimisticTask] = useOptimistic(
    myTasks,
    (state, title: string): TaskRow[] => [
      ...state,
      {
        id: `optimistic-${Date.now()}`,
        title,
        description: null,
        points: 1,
        points_approved: false,
        created_by: currentUserId,
        assigned_to: currentUserId,
        due_date: null,
        due_time: null,
        original_due_date: null,
        recurrence_unit: null,
        recurrence_value: null,
        is_active: true,
        completed_at: null,
        reminder_sent_at: null,
        is_time_sensitive: false,
        created_at: new Date().toISOString(),
        assignee: null,
      },
    ],
  );

  const [state, formAction] = useActionState(createTask, undefined);

  async function quickAddAction(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (title) addOptimisticTask(title);
    await formAction(formData);
  }

  return (
    <>
      <QuickAddTask action={quickAddAction} error={state?.error} />
      {children}
      <TaskBoard
        myTasks={optimisticMyTasks}
        otherTasks={otherTasks}
        editableTaskIds={editableTaskIds}
        bakingSteps={bakingSteps}
      />
    </>
  );
}
