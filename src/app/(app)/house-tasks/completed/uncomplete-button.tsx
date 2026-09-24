"use client";

import { useSave } from "@/lib/client/save";
import { uncompleteTask } from "../actions";
import { removeCompletionInCache, TASK_KEYS } from "../data";

// The entry drops off the list on tap; uncompleteTask then unwinds the task
// itself on the server, and the re-sync brings the open list and scoreboard
// in line (or the entry comes back with a toast if the server refuses).
export function UncompleteButton({ completionId }: { completionId: string }) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() =>
        void save(() => uncompleteTask(completionId), {
          keys: [...TASK_KEYS],
          optimistic: (qc) => removeCompletionInCache(qc, completionId),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      Uncomplete
    </button>
  );
}
