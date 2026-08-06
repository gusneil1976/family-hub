"use client";

import { useActionState } from "react";

type ActionState = { error: string } | undefined;

export function ApproveForm({
  currentPoints,
  action,
}: {
  currentPoints: number;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        type="number"
        name="points"
        min={1}
        defaultValue={currentPoints}
        className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Approving…" : "Approve"}
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
