"use client";

import { useActionState } from "react";
import { updateDisplayName } from "./actions";

export function DisplayNameForm({
  currentName,
}: {
  currentName: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateDisplayName,
    undefined,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <div>
        <label
          htmlFor="display_name"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          defaultValue={currentName ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      {state && "error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-green-700">Name updated.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
