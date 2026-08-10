"use client";

import { useActionState } from "react";
import { addStep } from "./actions";

type ActionState = { error: string } | undefined;

export function AddStepForm({ projectId }: { projectId: string }) {
  const boundAction = addStep.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    boundAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label
          htmlFor="due_date"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Date
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex-1">
        <label
          htmlFor="label"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Step
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="e.g. Check weight"
          className="w-full min-w-[10rem] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="recurrence_interval_days"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Repeats every (days)
        </label>
        <input
          id="recurrence_interval_days"
          name="recurrence_interval_days"
          type="number"
          min={1}
          placeholder="one-off"
          className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add step"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
