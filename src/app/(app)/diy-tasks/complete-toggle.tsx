"use client";

import { useTransition } from "react";
import { KIOSK_TOGGLE } from "../kiosk-styles";
import { setComplete } from "./actions";

export function CompleteToggle({
  taskId,
  completed,
  isKiosk,
}: {
  taskId: string;
  completed: boolean;
  isKiosk?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={`flex shrink-0 items-center gap-1.5 text-neutral-700 ${
        isKiosk ? "text-lg" : "text-sm"
      }`}
    >
      <input
        type="checkbox"
        checked={completed}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => setComplete(taskId, e.target.checked))
        }
        className={isKiosk ? KIOSK_TOGGLE : "h-4 w-4"}
      />
      Complete
    </label>
  );
}
