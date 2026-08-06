"use client";

import { useTransition } from "react";
import { setTaskActive } from "./actions";

export function ActiveToggle({
  taskId,
  isActive,
}: {
  taskId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setTaskActive(taskId, !isActive))}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
