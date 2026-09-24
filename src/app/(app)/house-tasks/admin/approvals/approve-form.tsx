"use client";

import { useSave, patch } from "@/lib/client/save";
import { APPROVAL_TASKS, TASK_KEYS, type ApprovalRow } from "../../data";
import { approveTaskPoints } from "./actions";

// The task leaves the queue as soon as Approve is tapped; approveTaskPoints
// runs in the background and the row comes back with a toast if it refuses
// (e.g. negative points). The re-sync also refreshes the scoreboard, since
// earlier completions of this task start counting.
export function ApproveForm({
  taskId,
  currentPoints,
}: {
  taskId: string;
  currentPoints: number;
}) {
  const save = useSave();

  function approve(formData: FormData) {
    void save(() => approveTaskPoints(taskId, undefined, formData), {
      keys: [...TASK_KEYS],
      optimistic: (qc) =>
        patch<ApprovalRow[]>(qc, APPROVAL_TASKS, (tasks) =>
          tasks.filter((t) => t.id !== taskId),
        ),
    });
  }

  return (
    <form action={approve} className="flex items-center gap-2">
      <input
        type="number"
        name="points"
        min={0}
        defaultValue={currentPoints}
        className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Approve
      </button>
    </form>
  );
}
