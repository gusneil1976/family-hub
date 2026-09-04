"use client";

import { useTransition } from "react";
import { uncompleteTask } from "../actions";

export function UncompleteButton({ completionId }: { completionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => uncompleteTask(completionId))}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {pending ? "…" : "Uncomplete"}
    </button>
  );
}
