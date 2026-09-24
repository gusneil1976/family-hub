"use client";

import { useSave } from "@/lib/client/save";
import { KIOSK_TOGGLE } from "../kiosk-styles";
import { setComplete } from "./actions";
import { DIY_KEYS, patchDiyTask } from "./data";

export function CompleteToggle({
  taskId,
  completed,
  isKiosk,
}: {
  taskId: string;
  completed: boolean;
  isKiosk?: boolean;
}) {
  const save = useSave();

  // The task moves between the open and Completed sections on tap (a patch
  // mirroring what setComplete writes); undone with a toast if the save fails.
  function toggle(next: boolean) {
    void save(() => setComplete(taskId, next), {
      keys: [...DIY_KEYS],
      optimistic: (qc) =>
        patchDiyTask(qc, taskId, (t) =>
          next
            ? { ...t, completed_at: new Date().toISOString(), percent_complete: 100 }
            : { ...t, completed_at: null },
        ),
    });
  }

  return (
    <label
      className={`flex shrink-0 items-center gap-1.5 text-neutral-700 ${
        isKiosk ? "text-lg" : "text-sm"
      }`}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => toggle(e.target.checked)}
        className={isKiosk ? KIOSK_TOGGLE : "h-4 w-4"}
      />
      Complete
    </label>
  );
}
