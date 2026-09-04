"use client";

import { useTransition } from "react";
import { markNotCompleted } from "./actions";

export function NotCompletedButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Mark this as not completed? This deducts its points from whoever it's assigned to.",
          )
        ) {
          startTransition(() => markNotCompleted(taskId));
        }
      }}
      className="rounded-md bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "…" : "Not completed"}
    </button>
  );
}
