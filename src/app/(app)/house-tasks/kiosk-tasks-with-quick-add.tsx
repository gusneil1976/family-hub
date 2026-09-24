"use client";

import type { Profile, Task } from "@/lib/types";
import { useSave, patch } from "@/lib/client/save";
import type { DueBakingStep } from "../curing/get-due-steps";
import { createTask } from "./new/actions";
import { KioskQuickAddTask } from "./kiosk-quick-add-task";
import { TaskBoard } from "./task-board";
import { draftTask, OPEN_TASKS, TASK_KEYS } from "./data";

type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

type PersonSummary = Pick<Profile, "id" | "display_name">;
type PersonTasks = { person: PersonSummary; tasks: TaskRow[] };

// Kiosk's equivalent of tasks-with-quick-add.tsx — same instant placeholder
// row, assigned to whoever was picked in "who's adding this", so it lands
// straight in that person's group.
export function KioskTasksWithQuickAdd({
  myTasks,
  otherTasks,
  editableTaskIds,
  bakingSteps,
  kioskProfiles,
  peopleTasks,
  children,
}: {
  myTasks: TaskRow[];
  otherTasks: TaskRow[];
  editableTaskIds: string[];
  bakingSteps?: DueBakingStep[];
  kioskProfiles: Profile[];
  peopleTasks: PersonTasks[];
  children?: React.ReactNode;
}) {
  const save = useSave();

  function quickAddAction(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const performedBy = String(formData.get("performed_by") ?? "").trim();
    if (!title || !performedBy) return;
    const person = kioskProfiles.find((p) => p.id === performedBy);
    void save(() => createTask(undefined, formData), {
      keys: [...TASK_KEYS],
      optimistic: (qc) =>
        patch<TaskRow[]>(qc, OPEN_TASKS, (tasks) => [
          ...tasks,
          draftTask(title, performedBy, person?.display_name ?? null),
        ]),
    });
  }

  return (
    <>
      <KioskQuickAddTask profiles={kioskProfiles} action={quickAddAction} />
      {children}
      <TaskBoard
        myTasks={myTasks}
        otherTasks={otherTasks}
        editableTaskIds={editableTaskIds}
        bakingSteps={bakingSteps}
        kioskProfiles={kioskProfiles}
        peopleTasks={peopleTasks}
      />
    </>
  );
}
