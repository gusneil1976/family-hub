"use client";

import { useSave, patch } from "@/lib/client/save";
import type { Task } from "@/lib/types";
import { OPEN_TASKS, TASK_KEYS, type TaskRow } from "../../data";
import { setTaskActive } from "./actions";

// Flips straight away on tap; a deactivated task also leaves the open list
// at once (a reactivated one reappears there on the re-sync).
export function ActiveToggle({
  taskId,
  isActive,
}: {
  taskId: string;
  isActive: boolean;
}) {
  const save = useSave();

  function toggle() {
    const active = !isActive;
    void save(() => setTaskActive(taskId, active), {
      keys: [...TASK_KEYS],
      optimistic: (qc) => {
        patch<Task | null>(qc, ["tasks", "one", taskId], (t) =>
          t ? { ...t, is_active: active } : t,
        );
        if (!active)
          patch<TaskRow[]>(qc, OPEN_TASKS, (tasks) =>
            tasks.filter((t) => t.id !== taskId),
          );
      },
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
