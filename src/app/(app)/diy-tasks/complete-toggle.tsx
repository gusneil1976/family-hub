"use client";

import { useTransition } from "react";
import { setComplete } from "./actions";

export function CompleteToggle({
  taskId,
  completed,
}: {
  taskId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex shrink-0 items-center gap-1.5 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={completed}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => setComplete(taskId, e.target.checked))
        }
        className="h-4 w-4"
      />
      Complete
    </label>
  );
}
