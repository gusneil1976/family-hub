"use client";

import { useState } from "react";
import { KioskModal } from "@/components/kiosk-modal";
import { useSave, patch } from "@/lib/client/save";
import { KIOSK_BUTTON_PRIMARY, KIOSK_BUTTON_SECONDARY } from "../../../kiosk-styles";
import { OPEN_TASKS, TASK_KEYS, type TaskRow } from "../../data";
import { deleteTask } from "./actions";

export function DeleteTaskButton({
  taskId,
  isKiosk,
}: {
  taskId: string;
  isKiosk?: boolean;
}) {
  const save = useSave();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // deleteTask redirects to /house-tasks itself on success, and the task is
  // taken out of the cached list first so it's already gone when the list
  // shows. It only ever returns on failure (not found, can't delete, has
  // completion history) — the list is then put back and the reason shown
  // here as well as in a toast.
  async function doDelete() {
    setError(null);
    const { data: result } = await save(() => deleteTask(taskId), {
      keys: [...TASK_KEYS],
      optimistic: (qc) =>
        patch<TaskRow[]>(qc, OPEN_TASKS, (tasks) =>
          tasks.filter((t) => t.id !== taskId),
        ),
    });
    if (result?.error) setError(result.error);
  }

  if (isKiosk) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`border-2 border-red-600 text-red-600 hover:bg-red-50 ${KIOSK_BUTTON_SECONDARY}`}
        >
          Delete task
        </button>
        <KioskModal open={open} onClose={() => setOpen(false)} title="Delete this task?">
          <p className="text-base text-neutral-600">This can&apos;t be undone.</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`flex-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50 ${KIOSK_BUTTON_SECONDARY}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void doDelete();
              }}
              className={`flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 ${KIOSK_BUTTON_PRIMARY}`}
            >
              Delete
            </button>
          </div>
        </KioskModal>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!confirm("Delete this task? This can't be undone.")) return;
          void doDelete();
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete task
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
