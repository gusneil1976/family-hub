"use client";

import type { Task } from "@/lib/types";
import { useSave, patch } from "@/lib/client/save";
import type { DueBakingStep } from "../curing/get-due-steps";
import { createTask } from "./new/actions";
import { QuickAddTask } from "./quick-add-task";
import { TaskBoard } from "./task-board";
import { draftTask, OPEN_TASKS, TASK_KEYS } from "./data";

type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

// Owns the quick-add box together with the list it feeds, so a submitted
// task appears in "My tasks" the instant it's typed (a placeholder row in
// the cached list) while createTask runs; the re-sync afterwards swaps in
// the real row, or the placeholder is rolled back if the save fails.
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
  const save = useSave();

  function quickAddAction(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    void save(() => createTask(undefined, formData), {
      keys: [...TASK_KEYS],
      optimistic: (qc) =>
        patch<TaskRow[]>(qc, OPEN_TASKS, (tasks) => [
          ...tasks,
          draftTask(title, currentUserId, null),
        ]),
    });
  }

  return (
    <>
      <QuickAddTask action={quickAddAction} />
      {children}
      <TaskBoard
        myTasks={myTasks}
        otherTasks={otherTasks}
        editableTaskIds={editableTaskIds}
        bakingSteps={bakingSteps}
      />
    </>
  );
}
