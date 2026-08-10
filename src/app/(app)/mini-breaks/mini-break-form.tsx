"use client";

import { useActionState } from "react";

type ActionState = { error: string } | undefined;

export function MiniBreakForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    title?: string;
    date_from?: string | null;
    date_to?: string | null;
    notes?: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Where/what
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label
            htmlFor="date_from"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            From (optional)
          </label>
          <input
            id="date_from"
            name="date_from"
            type="date"
            defaultValue={defaultValues?.date_from ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="date_to"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            To (optional)
          </label>
          <input
            id="date_to"
            name="date_to"
            type="date"
            defaultValue={defaultValues?.date_to ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
