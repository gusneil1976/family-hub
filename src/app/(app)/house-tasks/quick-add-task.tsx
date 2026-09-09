"use client";

import { useActionState } from "react";
import { createTask } from "./new/actions";

// A fast-entry alternative to the full "New task" form: title only, right
// on the list. Reuses createTask as-is — everything left unset (points,
// assignment, due date, recurrence) just takes its normal default (1 point,
// assigned to whoever added it, one-off, no due date), same as leaving
// those fields blank on the full form. Use Edit afterward to fill any of
// that in — allocate it to someone else, set it recurring, add a due date.
export function QuickAddTask() {
  const [state, formAction, pending] = useActionState(createTask, undefined);

  return (
    <form action={formAction} className="mb-4 flex items-start gap-2">
      <div className="flex-1">
        <input
          name="title"
          required
          placeholder="Quick add a task…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        {state?.error && (
          <p className="mt-1 text-xs text-red-600">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-accent px-3 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
