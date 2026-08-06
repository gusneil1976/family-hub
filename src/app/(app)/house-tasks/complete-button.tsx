"use client";

import { useTransition } from "react";
import { completeTask } from "./actions";

export function CompleteButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => completeTask(taskId))}
      className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Saving…" : "Complete"}
    </button>
  );
}
