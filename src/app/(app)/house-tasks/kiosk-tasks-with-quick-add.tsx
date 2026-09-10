"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import type { Profile, Task } from "@/lib/types";
import type { DueBakingStep } from "../curing/get-due-steps";
import { createTask } from "./new/actions";
import { KioskQuickAddTask } from "./kiosk-quick-add-task";
import { TaskBoard } from "./task-board";

type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

type PersonSummary = Pick<Profile, "id" | "display_name">;
type PersonTasks = { person: PersonSummary; tasks: TaskRow[] };

// Kiosk's equivalent of tasks-with-quick-add.tsx — same optimistic-update
// idea, but grouped per person instead of a flat myTasks list, since
// that's how kiosk's Tasks screen is organised (no "logged in as" identity
// to split my/other by). The new task is appended straight into whichever
// person's group matches the "who's adding this" pick, then swapped for
// the real row once the reload lands.
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
  const [optimisticPeopleTasks, addOptimisticTask] = useOptimistic(
    peopleTasks,
    (
      state,
      { title, performedBy }: { title: string; performedBy: string },
    ): PersonTasks[] => {
      const person = kioskProfiles.find((p) => p.id === performedBy);
      const optimisticTask: TaskRow = {
        id: `optimistic-${Date.now()}`,
        title,
        description: null,
        points: 0,
        points_approved: true,
        created_by: performedBy,
        assigned_to: performedBy,
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
        assignee: person ? { display_name: person.display_name } : null,
      };
      return state.map((group) =>
        group.person.id === performedBy
          ? { ...group, tasks: [...group.tasks, optimisticTask] }
          : group,
      );
    },
  );

  const [state, formAction] = useActionState(createTask, undefined);
  const [, startTransition] = useTransition();

  function quickAddAction(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const performedBy = String(formData.get("performed_by") ?? "").trim();
    startTransition(async () => {
      if (title && performedBy) addOptimisticTask({ title, performedBy });
      await formAction(formData);
    });
  }

  return (
    <>
      <KioskQuickAddTask
        profiles={kioskProfiles}
        action={quickAddAction}
        error={state?.error}
      />
      {children}
      <TaskBoard
        myTasks={myTasks}
        otherTasks={otherTasks}
        editableTaskIds={editableTaskIds}
        bakingSteps={bakingSteps}
        kioskProfiles={kioskProfiles}
        peopleTasks={optimisticPeopleTasks}
      />
    </>
  );
}
